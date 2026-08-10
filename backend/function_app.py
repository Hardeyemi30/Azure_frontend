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
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

jwt_secret = os.getenv("JWT_SECRET")
# token is created per-user via create_access_token(); do not create a global token here


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
    database_name = os.getenv(
        "COSMOS_DATABASE_NAME"
    )

    if not endpoint:
        raise RuntimeError(
            "COSMOS_ENDPOINT is missing."
        )

    if not key:
        raise RuntimeError(
            "COSMOS_KEY is missing."
        )

    if not database_name:
        raise RuntimeError(
            "COSMOS_DATABASE_NAME is missing."
        )

    client = CosmosClient(
        endpoint,
        credential=key
    )

    database = (
        client.get_database_client(
            database_name
        )
    )

    # IMPORTANT:
    # dashboard data belongs in analytics
    return database.get_container_client(
        "analytics"
    )
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



def save_cleaned_csv_to_blob(dataframe):
    """Persist cleaned nutrition CSV data to blob storage."""
    logging.info("Saving cleaned nutrition data to blob storage.")
    return dataframe


def save_recipes_to_cosmos(dataframe, dataset_version):
    """Persist recipe documents to Cosmos DB."""
    logging.info("Saving recipes to Cosmos DB.")
    recipes_container = get_recipes_container()

    for index, row in dataframe.iterrows():
        recipe_id = hashlib.sha256(
            f"{row['Recipe_name']}-{index}".encode()
        ).hexdigest()

        recipe = {
            "id": recipe_id,
            "recipe_name": str(row["Recipe_name"]),
            "diet_type": str(row["Diet_type"]),
            "cuisine": str(row["Cuisine_type"]),
            "protein": float(row["Protein(g)"]),
            "carbohydrates": float(row["Carbs(g)"]),
            "fat": float(row["Fat(g)"]),
            "dataset_version": dataset_version,
        }

        recipes_container.upsert_item(recipe)

    return dataframe

logging.info(
    "Writing dashboard-analysis to ANALYTICS container"
)

def save_analysis_to_cosmos(
    analysis,
    dataset_version
):
    analytics_container = (
        get_analytics_container()
    )

    analysis_document = {
        "id": "dashboard-analysis",
        "type": "dashboard",
        "partitionKey": "dashboard",

        "datasetVersion":
            dataset_version,

        "generatedAt":
            datetime.now(
                timezone.utc
            ).isoformat(),

        "summary":
            analysis.get(
                "summary",
                {}
            ),

        "byDiet":
            analysis.get(
                "byDiet",
                []
            ),

        "scatter":
            analysis.get(
                "scatter",
                []
            ),

        "heatmap":
            analysis.get(
                "heatmap",
                []
            ),

        "caloriesPie":
            analysis.get(
                "caloriesPie",
                []
            ),
    }

    result = (
        analytics_container
        .upsert_item(
            body=analysis_document
        )
    )

    logging.info(
        "ANALYTICS UPSERT SUCCESS"
    )

    logging.info(
        "Saved analytics item ID: %s",
        result.get("id")
    )

    return result


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
    connection="AZURE_STORAGE_CONNECTION_STRING",
)
def process_diet_file(
    blob: func.InputStream
):
    try:
        logging.info(
            "=== DATASET PROCESSING START ==="
        )

        # 1. Read CSV
        raw_data = blob.read()

        # 2. Create dataset fingerprint
        dataset_version = (
            hashlib.sha256(
                raw_data
            ).hexdigest()
        )

        logging.info(
            f"Dataset version: {dataset_version}"
        )

        # 3. Convert CSV to DataFrame
        dataframe = pd.read_csv(
            io.BytesIO(raw_data)
        )

        logging.info(
            f"Loaded {len(dataframe)} rows."
        )

        # 4. Clean once
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

        # 5. Upload cleaned CSV
        logging.info(
            "Uploading cleaned CSV..."
        )

        upload_cleaned_csv(
            cleaned_dataframe
        )

        # 6. Calculate dashboard once
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

        # 7. Save recipes
        logging.info(
            "Saving recipes to Cosmos DB."
        )

        save_recipes_to_cosmos(
            cleaned_dataframe,
            dataset_version
        )

        logging.info(
            "Recipes saved."
        )

        # 8. Save dashboard analysis
        logging.info(
            "Saving dashboard analysis to Cosmos DB."
        )

        save_analysis_to_cosmos(
            analysis,
            dataset_version
        )

        logging.info(
            "Dashboard analysis saved to Cosmos DB."
        )

        logging.info(
            "=== DATASET PROCESSING COMPLETE ==="
        )

    except Exception as error:
        logging.exception(
            "Dataset processing failed."
        )

        raise
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
) -> func.HttpResponse:

    try:
        analytics_container = (
            get_analytics_container()
        )

        query = """
        SELECT * FROM c
        WHERE c.id = @id
        """

        items = list(
            analytics_container.query_items(
                query=query,
                parameters=[
                    {
                        "name": "@id",
                        "value":
                            "dashboard-analysis"
                    }
                ],
                enable_cross_partition_query=True
            )
        )

        if not items:
            return json_response(
                {
                    "success": False,
                    "error":
                        "Dashboard analysis has not been generated yet."
                },
                status_code=404
            )

        analysis = items[0]

        return json_response(
            {
                "success": True,

                "message":
                    "Precomputed analysis returned.",

                "generatedAt":
                    analysis.get(
                        "generatedAt"
                    ),

                "data": {
                    "summary":
                        analysis.get(
                            "summary",
                            {}
                        ),

                    "byDiet":
                        analysis.get(
                            "byDiet",
                            []
                        ),

                    "scatter":
                        analysis.get(
                            "scatter",
                            []
                        ),

                    "heatmap":
                        analysis.get(
                            "heatmap",
                            []
                        ),

                    "caloriesPie":
                        analysis.get(
                            "caloriesPie",
                            []
                        ),
                },
            },
            status_code=200
        )

    except Exception as error:
        logging.exception(
            "Unexpected nutrition analysis error."
        )

        return json_response(
            {
                "success": False,
                "error":
                    "Internal server error.",
                "details":
                    str(error)
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
    auth_level=func.AuthLevel.ANONYMOUS
)
def login(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()

        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not email or not password:
            return json_response(
                {
                    "success": False,
                    "error": "Email and password are required."
                },
                400
            )

        users_container = get_users_container()

        query = """
        SELECT * FROM c
        WHERE c.email = @email
        """

        parameters = [
            {
                "name": "@email",
                "value": email
            }
        ]

        users = list(
            users_container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            )
        )

        if not users:
            return json_response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                401
            )

        user = users[0]

        password_hash = user.get("password_hash")

        if not password_hash:
            return json_response(
                {
                    "success": False,
                    "error": "This account does not use password login."
                },
                401
            )

        valid_password = bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8")
        )

        if not valid_password:
            return json_response(
                {
                    "success": False,
                    "error": "Invalid email or password."
                },
                401
            )

        jwt_secret = os.getenv("JWT_SECRET")

        if not jwt_secret:
            return json_response(
                {
                    "success": False,
                    "error": "JWT configuration is missing."
                },
                500
            )

        token = jwt.encode(
            {
                "sub": user["id"],
                "email": user["email"],
                "name": user["name"],
                "exp": datetime.now(timezone.utc)
                + timedelta(hours=2)
            },
            jwt_secret,
            algorithm="HS256"
        )

        return json_response(
            {
                "success": True,
                "message": "Login successful.",
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            },
            200
        )

    except Exception as error:
        logging.exception("Login failed")

        return json_response(
            {
                "success": False,
                "error": str(error)
            },
            500
        )

@app.route(
    route="auth/google",
    methods=["POST"],
    auth_level=func.AuthLevel.ANONYMOUS,
)

def google_login(req: func.HttpRequest) -> func.HttpResponse:

    try:
        # ---------------------------------
        # 1. Read credential from frontend
        # ---------------------------------
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

        google_token = body.get(
            "credential",
            ""
        )

        if not google_token:
            return json_response(
                {
                    "success": False,
                    "error": "Google credential is required."
                },
                400
            )

        # ---------------------------------
        # 2. Get Google Client ID
        # ---------------------------------
        google_client_id = os.getenv(
            "GOOGLE_CLIENT_ID"
        )

        if not google_client_id:
            return json_response(
                {
                    "success": False,
                    "error": "Google Client ID is not configured."
                },
                500
            )

        # ---------------------------------
        # 3. Verify Google ID token
        # ---------------------------------
        google_user = (
            id_token.verify_oauth2_token(
                google_token,
                google_requests.Request(),
                google_client_id
            )
        )

        # ---------------------------------
        # 4. Read verified Google claims
        # ---------------------------------
        google_id = google_user["sub"]

        email = (
            google_user
            .get("email", "")
            .strip()
            .lower()
        )

        name = google_user.get(
            "name",
            email
        )

        if not email:
            return json_response(
                {
                    "success": False,
                    "error": "Google account has no email."
                },
                400
            )

        # ---------------------------------
        # 5. Connect to users container
        # ---------------------------------
        users_container = (
            get_users_container()
        )

        # ---------------------------------
        # 6. Search for existing user
        # ---------------------------------
        query = """
        SELECT *
        FROM c
        WHERE c.email = @email
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

        # ---------------------------------
        # 7. Existing or new user
        # ---------------------------------
        if users:
            user = users[0]

        else:
            user = {
                "id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "provider": "google",
                "google_id": google_id
            }

            users_container.create_item(
                body=user
            )

        # ---------------------------------
        # 8. Successful response
        # ---------------------------------
        return json_response(
            {
                "success": True,

                "message":
                    "Google login successful.",

                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "provider": user.get(
                        "provider",
                        "google"
                    )
                }
            },
            200
        )

    except ValueError:
        return json_response(
            {
                "success": False,
                "error":
                    "Invalid Google credential."
            },
            401
        )

    except Exception as error:
        logging.exception(
            "Google login error"
        )

        return json_response(
            {
                "success": False,
                "error":
                    "Google authentication failed."
            },
            500
        )
