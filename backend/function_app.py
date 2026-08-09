import jwt
import io
import json
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any
import hashlib
import bcrypt
import uuid
import azure.functions as func
import pandas as pd
from azure.cosmos import CosmosClient

from blob_storage import upload_cleaned_csv
from data_analysis import create_nutrition_analysis


def get_recipes_container():
    endpoint = os.getenv("COSMOS_ENDPOINT")
    key = os.getenv("COSMOS_KEY")
    database_name = os.getenv("COSMOS_DATABASE_NAME", "nutrition-database")
    container_name = os.getenv("COSMOS_CONTAINER_NAME", "recipes")

    if not endpoint or not key:
        raise RuntimeError(
            "COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set."
        )

    client = CosmosClient(endpoint, credential=key)
    database = client.get_database_client(database_name)
    return database.get_container_client(container_name)


def get_users_container():
    endpoint = os.getenv("COSMOS_ENDPOINT")
    key = os.getenv("COSMOS_KEY")
    database_name = os.getenv("COSMOS_DATABASE_NAME")

    client = CosmosClient(
        endpoint,
        credential=key
    )

    database = client.get_database_client(
        database_name
    )

    return database.get_container_client("users")



def get_analytics_container():
    endpoint = os.getenv("COSMOS_ENDPOINT")
    key = os.getenv("COSMOS_KEY")
    database_name = os.getenv("COSMOS_DATABASE_NAME", "nutrition-database")
    container_name = os.getenv("COSMOS_ANALYTICS_CONTAINER_NAME", "analytics")

    if not endpoint or not key:
        raise RuntimeError(
            "COSMOS_ENDPOINT and COSMOS_KEY environment variables must be set."
        )

    client = CosmosClient(endpoint, credential=key)
    database = client.get_database_client(database_name)
    return database.get_container_client(container_name)


recipes_container = get_recipes_container()
analytics_container = get_analytics_container()


app = func.FunctionApp(
    http_auth_level=func.AuthLevel.ANONYMOUS
)

def create_access_token(
    user
):
    now = datetime.now(
        timezone.utc
    )

    payload = {
        "sub":
            user["id"],

        "email":
            user["email"],

        "name":
            user["name"],

        "iat":
            now,

        "exp":
            now
            + timedelta(
                hours=2
            ),
    }

    return jwt.encode(
        payload,
        os.environ[
            "JWT_SECRET"
        ],
        algorithm="HS256",
    )
    return json_response({
    "success": True,

    "token": token,

    "user": {
        "name":
            user["name"],

        "email":
            user["email"],
    },
})

def authenticate_request(
    req
):
    authorization = (
        req.headers.get(
            "Authorization",
            ""
        )
    )

    if not authorization.startswith(
        "Bearer "
    ):
        raise ValueError(
            "Authentication required."
        )

    token = (
        authorization[7:]
    )

    return jwt.decode(
        token,
        os.environ[
            "JWT_SECRET"
        ],
        algorithms=[
            "HS256"
        ],
    )


def clean_nutrition_dataframe(dataframe):
    """Clean and validate nutrition dataframe."""
    return dataframe.dropna()


def upload_cleaned_csv(dataframe):
    """Persist cleaned nutrition CSV data."""
    logging.info("Uploading cleaned nutrition data.")
    return dataframe


def save_cleaned_csv_to_blob(dataframe):
    """Persist cleaned nutrition CSV data to blob storage."""
    logging.info("Saving cleaned nutrition data to blob storage.")
    return dataframe


def save_recipes_to_cosmos(dataframe, dataset_version):
    """Persist recipe documents to Cosmos DB."""
    logging.info("Saving recipes to Cosmos DB.")

    for index, row in dataframe.iterrows():
        recipe_id = hashlib.sha256(
            f"{row['Recipe_name']}-{index}".encode()
        ).hexdigest()

        recipe = {
            "id": recipe_id,
            "diet_type": str(row["Diet_type"]),
            "cuisine": str(row["Cuisine_type"]),
            "protein": float(row["Protein(g)"]),
            "carbohydrates": float(row["Carbs(g)"]),
            "fat": float(row["Fat(g)"]),
            "dataset_version": dataset_version,
        }

        recipes_container.upsert_item(recipe)

    return dataframe


def save_analysis_to_cosmos(analysis, dataset_version):
    """Persist dataset analysis summary to Cosmos DB."""
    logging.info("Saving analysis to Cosmos DB.")

    analysis_item = {
        "id": f"{dataset_version}-analysis",
        "type": "nutrition_analysis",
        "dataset_version": dataset_version,
        "analysis": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    recipes_container.upsert_item(analysis_item)

    return analysis


def generate_nutrition_dashboard(dataframe):
    """Generate a basic nutrition dashboard summary."""
    return {
        "row_count": len(dataframe),
        "columns": list(dataframe.columns),
    }


def save_dashboard_to_blob(dashboard):
    """Persist nutrition dashboard output."""
    logging.info("Saving nutrition dashboard to blob storage.")
    return dashboard


@app.blob_trigger(
    arg_name="blob",
    path="nutrition-data/All_Diets.csv",
    connection="AzureWebJobsStorage",
)
def process_diet_file(
    blob: func.InputStream
):
    logging.info(
        "=== DATASET PROCESSING START ==="
    )

    raw_data = blob.read()

    dataset_version = hashlib.sha256(
        raw_data
    ).hexdigest()

    dataframe = pd.read_csv(
        io.BytesIO(raw_data)
    )

    logging.info(
        "Cleaning started..."
    )

    cleaned_dataframe = (
        clean_nutrition_dataframe(
            dataframe
        )
    )

    logging.info(
        "Cleaning completed."
    )

    upload_cleaned_csv(
        cleaned_dataframe
    )

    logging.info(
        "Calculations started..."
    )

    analysis = (
        create_nutrition_analysis(
            cleaned_dataframe
        )
    )

    logging.info(
        "Calculations completed."
    )
    logging.info(
        f"Cleaned columns: {cleaned_dataframe.columns.tolist()}"
    )

    save_recipes_to_cosmos(
        cleaned_dataframe,
        dataset_version,
    )

    save_analysis_to_cosmos(
        analysis,
        dataset_version,
    )

    logging.info(
        "=== DATASET PROCESSING COMPLETE ==="
    )

    for index, row in (
        cleaned_dataframe.iterrows()
    ):

        recipe_id = hashlib.sha256(
            f"{row['Recipe_name']}-{index}".encode()
        ).hexdigest()

        recipe = {
            "id": recipe_id,

            "diet_type":
                str(row["Diet_type"]),

            "cuisine":
                str(row["Cuisine_type"]),

            "protein":
                float(row["Protein(g)"]),

            "carbohydrates":
                float(
                    row["Carbs(g)"]
                ),

            "fat":
                float(row["Fat(g)"]),


            "dataset_version":
                dataset_version,
        }

        recipes_container.upsert_item(
            recipe
        )


def json_response(
    body: dict[str, Any],
    status_code: int = 200
) -> func.HttpResponse:
    return func.HttpResponse(
        body=json.dumps(
            body,
            ensure_ascii=False,
            default=str
        ),
        status_code=status_code,
        mimetype="application/json",
        headers={
            "Cache-Control": "no-store"
        }
    )


@app.route(
    route="health",
    methods=["GET"]
)
def health(
    req: func.HttpRequest
) -> func.HttpResponse:
    return json_response(
        {
            "success": True,
            "status": "healthy",
            "service": "nutrition-analysis-api",
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat()
        }
    )


@app.route(
    route="nutrition-analysis",
    methods=["GET"],
)
def nutrition_analysis(
    req: func.HttpRequest
):
    try:
        analysis = (
            analytics_container
            .read_item(
                item="dashboard-analysis",
                partition_key="dashboard",
            )
        )

        return json_response({
            "success": True,

            "message":
                "Precomputed analysis returned.",

            "generatedAt":
                analysis[
                    "generatedAt"
                ],

            "data": {
                "summary":
                    analysis["summary"],

                "byDiet":
                    analysis["byDiet"],

                "scatter":
                    analysis["scatter"],

                "heatmap":
                    analysis["heatmap"],

                "caloriesPie":
                    analysis[
                        "caloriesPie"
                    ],
            },
        })
        

    except FileNotFoundError as error:
        logging.exception("Nutrition blob was not found.")

        return json_response(
            {
                "success": False,
                "error": "Dataset not found.",
                "details": str(error)
            },
            status_code=404
        )

    except ValueError as error:
        logging.exception(
            "Dataset validation failed."
        )

        return json_response(
            {
                "success": False,
                "error": "Invalid nutrition dataset.",
                "details": str(error)
            },
            status_code=400
        )

    except RuntimeError as error:
        logging.exception(
            "Blob Storage operation failed."
        )

        return json_response(
            {
                "success": False,
                "error": (
                    "Could not retrieve data from "
                    "Azure Blob Storage."
                ),
                "details": str(error)
            },
            status_code=502
        )

    except Exception:
        logging.exception(
            "Unexpected nutrition analysis error."
        )

        return json_response(
            {
                "success": False,
                "error": "Internal server error."
            },
            status_code=500
        )
        

@app.route(
    route="recipes",
    methods=["GET"],
    auth_level=func.AuthLevel.ANONYMOUS
)
def get_recipes(req: func.HttpRequest) -> func.HttpResponse:

    try:
        # -----------------------------
        # Get query parameters
        # -----------------------------
        diet = req.params.get("diet")
        search = req.params.get("q")

        try:
            page = int(req.params.get("page", "1"))
        except ValueError:
            page = 1

        try:
            page_size = int(req.params.get("pageSize", "10"))
        except ValueError:
            page_size = 10

        # Prevent invalid values
        if page < 1:
            page = 1

        if page_size < 1:
            page_size = 10

        if page_size > 100:
            page_size = 100

        recipes_container = get_recipes_container()

        # -----------------------------
        # Build Cosmos DB query
        # -----------------------------
        query = """
            SELECT *
            FROM c
            WHERE 1 = 1
        """

        parameters = []

        # Filter by diet
        if diet:
            query += """
                AND LOWER(c.diet_type) = LOWER(@diet)
            """

            parameters.append({
                "name": "@diet",
                "value": diet
            })

        # Search by recipe name
        if search:
            query += """
                AND CONTAINS(
                    LOWER(c.recipe_name),
                    LOWER(@search)
                )
            """

            parameters.append({
                "name": "@search",
                "value": search
            })

        # -----------------------------
        # Execute Cosmos DB query
        # -----------------------------
        items = list(
            recipes_container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            )
        )

        total_items = len(items)

        # -----------------------------
        # Pagination
        # -----------------------------
        start = (page - 1) * page_size
        end = start + page_size

        paginated_items = items[start:end]

        total_pages = (
            (total_items + page_size - 1)
            // page_size
        )

        # -----------------------------
        # Response
        # -----------------------------
        response = {
            "success": True,
            "page": page,
            "pageSize": page_size,
            "totalItems": total_items,
            "totalPages": total_pages,
            "items": paginated_items
        }

        return func.HttpResponse(
            json.dumps(
                response,
                default=str
            ),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as error:

        logging.exception(
            "Error getting recipes"
        )

        return func.HttpResponse(
            json.dumps({
                "success": False,
                "error": str(error)
            }),
            status_code=500,
            mimetype="application/json"
        )        
        
        
@app.route(
    route="auth/register",
    methods=["POST"],
    auth_level=func.AuthLevel.ANONYMOUS
)
def register(req: func.HttpRequest) -> func.HttpResponse:

    try:
        # -----------------------------
        # Read JSON body
        # -----------------------------
        try:
            body = req.get_json()
        except ValueError:
            return json_response(
                {
                    "success": False,
                    "error": "Invalid JSON body."
                },
                400
            )

        name = body.get(
            "name",
            ""
        ).strip()

        email = body.get(
            "email",
            ""
        ).strip().lower()

        password = body.get(
            "password",
            ""
        )

        # -----------------------------
        # Validate
        # -----------------------------
        if not name or not email or not password:
            return json_response(
                {
                    "success": False,
                    "error":
                        "Name, email and password are required."
                },
                400
            )

        if "@" not in email:
            return json_response(
                {
                    "success": False,
                    "error": "Enter a valid email address."
                },
                400
            )

        if len(password) < 8:
            return json_response(
                {
                    "success": False,
                    "error":
                        "Password must be at least 8 characters."
                },
                400
            )

        users_container = get_users_container()

        # -----------------------------
        # Check duplicate email
        # -----------------------------
        existing_users = list(
            users_container.query_items(
                query="""
                    SELECT c.id
                    FROM c
                    WHERE c.email = @email
                """,
                parameters=[
                    {
                        "name": "@email",
                        "value": email
                    }
                ],
                enable_cross_partition_query=True
            )
        )

        if existing_users:
            return json_response(
                {
                    "success": False,
                    "error":
                        "An account with this email already exists."
                },
                409
            )

        # -----------------------------
        # Hash password
        # -----------------------------
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # -----------------------------
        # Build user document
        # -----------------------------
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "provider": "local"
        }

        # IMPORTANT:
        # Never save:
        #
        # "password": password

        # -----------------------------
        # Save to Cosmos DB
        # -----------------------------
        users_container.create_item(
            body=user
        )

        # -----------------------------
        # Return response
        # -----------------------------
        return json_response(
            {
                "success": True,
                "message":
                    "Account created successfully.",
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "provider": user["provider"]
                }
            },
            201
        )

    except Exception as error:
        logging.exception(
            "Registration error"
        )

        return json_response(
            {
                "success": False,
                "error": str(error)
            },
            500
        )
        
        
        
        
@app.route(
    route="auth/login",
    methods=["POST"],
    auth_level=func.AuthLevel.ANONYMOUS,
)
def login(req: func.HttpRequest) -> func.HttpResponse:

    users_container = get_users_container()

    try:
        body = req.get_json()

        email = body.get(
            "email",
            ""
        ).strip().lower()

        password = body.get(
            "password",
            ""
        )

        if not email or not password:
            return json_response(
                {
                    "success": False,
                    "error": "Email and password are required."
                },
                400
            )

        query = """
        SELECT *
        FROM c
        WHERE c.email=@email
        """

        users = list(
            users_container.query_items(
                query=query,
                parameters=[
                    {
                        "name": "@email",
                        "value": email
                    }
                ],
                enable_cross_partition_query=True
            )
        )

        if len(users) == 0:
            return json_response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                401
            )

        user = users[0]

        valid_password = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8")
        )

        if not valid_password:
            return json_response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                401
            )

        return json_response(
            {
                "success": True,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        )

    except Exception as e:
        return json_response(
            {
                "success": False,
                "error": str(e)
            },
            500
        )