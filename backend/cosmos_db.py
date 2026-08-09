from datetime import datetime, timezone
import os

from azure.cosmos import CosmosClient


COSMOS_CONNECTION_STRING = os.environ[
    "COSMOS_CONNECTION_STRING"
]

COSMOS_DATABASE_NAME = os.getenv(
    "COSMOS_DATABASE_NAME",
    "NutritionDashboard"
)


client = CosmosClient.from_connection_string(
    COSMOS_CONNECTION_STRING
)

database = client.get_database_client(
    COSMOS_DATABASE_NAME
)

users_container = database.get_container_client(
    "users"
)

recipes_container = database.get_container_client(
    "recipes"
)

analytics_container = database.get_container_client(
    "analytics"
)

dataset_version = os.getenv(
    "DATASET_VERSION",
    "default"
)

analysis = {
    "summary": "",
    "byDiet": {},
    "scatter": {},
    "heatmap": {},
    "caloriesPie": {}
}

analysis_document = {
    "id": "dashboard-analysis",

    "type": "dashboard",

    "summary":
        analysis["summary"],

    "byDiet":
        analysis["byDiet"],

    "scatter":
        analysis["scatter"],

    "heatmap":
        analysis["heatmap"],

    "caloriesPie":
        analysis["caloriesPie"],

    "datasetVersion":
        dataset_version,

    "generatedAt":
        datetime.now(
            timezone.utc
        ).isoformat(),
}

analytics_container.upsert_item(
    analysis_document
)