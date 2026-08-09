import os
from azure.storage.blob import BlobServiceClient


def upload_cleaned_csv(
    dataframe
):
    connection_string = os.environ[
        "AZURE_STORAGE_CONNECTION_STRING"
    ]

    service = (
        BlobServiceClient
        .from_connection_string(
            connection_string
        )
    )

    client = service.get_blob_client(
        container="nutrition-data",
        blob="cleaned/All_Diets_clean.csv",
    )

    csv_data = dataframe.to_csv(
        index=False
    )

    client.upload_blob(
        csv_data,
        overwrite=True
    )