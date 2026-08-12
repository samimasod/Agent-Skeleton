"""
Storage service for managing artifacts and files.
Currently supports the 'local' filesystem mapping to the /artifacts StaticFiles route.
"""

import base64
import logging
import mimetypes
import uuid
from pathlib import Path
from typing import Optional

from apps.api.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.provider = settings.storage_provider.lower()
        self.local_artifacts_dir = Path(settings.storage_local_path) / settings.storage_gcs_prefix
        
        if self.provider == "local":
            self.local_artifacts_dir.mkdir(parents=True, exist_ok=True)

    async def upload_base64_image(self, b64_data: str, user_uid: str) -> Optional[str]:
        """
        Extracts base64 encoded strings, writes the file to the configured storage backend, 
        and returns a fully accessible public/internal URL.
        """
        try:
            # Strip standard tags e.g. data:image/png;base64,
            if "," in b64_data:
                header, encoded = b64_data.split(",", 1)
                # Parse mime type from header
                mime_type = header.split(";")[0].replace("data:", "")
            else:
                encoded = b64_data
                mime_type = "image/jpeg" # Default fallback
                
            extension = mimetypes.guess_extension(mime_type) or ".jpg"
            file_name = f"{user_uid}_{uuid.uuid4().hex[:8]}{extension}"

            image_bytes = base64.b64decode(encoded)

            if self.provider == "local":
                file_path = self.local_artifacts_dir / file_name
                with open(file_path, "wb") as f:
                    f.write(image_bytes)
                
                # Assume localhost/API host prefix if the app is local.
                # Use a relative/absolute route on the API server.
                # In prod, you'd prepend a HOST variable. For local testing, path relative to api root works.
                return f"/artifacts/{file_name}"

            elif self.provider in ["gcs", "s3"]:
                # STUB: Setup GCS/S3 boto3 or google-cloud-storage integration here
                logger.warning(f"{self.provider.upper()} storage is not fully implemented yet. Simulating upload...")
                return f"https://mock-{self.provider}-bucket.com/artifacts/{file_name}"
            
            else:
                logger.error(f"Unknown storage provider: {self.provider}")
                return None

        except Exception as e:
            logger.error(f"Failed to upload base64 image: {e}")
            return None
