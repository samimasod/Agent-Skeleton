"""
Storage service for uploading test artifacts to GCS or local filesystem.
"""
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime
import shutil

# Google Cloud Storage - conditionally imported
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

try:
    import boto3
    S3_AVAILABLE = True
except ImportError:
    S3_AVAILABLE = False


logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for storing test artifacts (screenshots, videos, logs).
    Supports local filesystem, Google Cloud Storage, and S3-compatible storage.
    """
    
    def __init__(
        self,
        provider: str = "local",  # "local", "gcs", or "s3"
        local_path: str = "./data/storage",
        gcs_bucket: Optional[str] = None,
        gcs_prefix: str = "artifacts",
        s3_bucket: Optional[str] = None,
        s3_prefix: str = "artifacts",
        s3_region: Optional[str] = None,
    ):
        self.provider = provider
        self.local_path = Path(local_path)
        self.gcs_bucket = gcs_bucket
        self.gcs_prefix = gcs_prefix
        self.s3_bucket = s3_bucket
        self.s3_prefix = s3_prefix
        self.s3_region = s3_region
        
        self._gcs_client = None
        self._bucket = None
        self._s3_client = None
        
        # Initialize storage
        if provider == "local":
            self.local_path.mkdir(parents=True, exist_ok=True)
        elif provider == "gcs" and GCS_AVAILABLE and gcs_bucket:
            self._gcs_client = storage.Client()
            self._bucket = self._gcs_client.bucket(gcs_bucket)
        elif provider == "s3" and S3_AVAILABLE and s3_bucket:
            session = boto3.session.Session(region_name=s3_region)
            self._s3_client = session.client("s3")
    
    def _generate_path(
        self,
        organization_id: int,
        project_id: int,
        test_run_id: int,
        filename: str,
    ) -> str:
        """Generate a storage path for an artifact."""
        date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
        prefix = self.gcs_prefix
        if self.provider == "s3":
            prefix = self.s3_prefix
        return f"{prefix}/{organization_id}/{project_id}/{date_prefix}/{test_run_id}/{filename}"

    def _public_artifact_path(self, storage_path: str) -> str:
        """Convert an internal storage path to the public local artifact URL path."""
        normalized = storage_path.lstrip("/")

        for prefix in (self.gcs_prefix.strip("/"), self.s3_prefix.strip("/")):
            if prefix and normalized.startswith(f"{prefix}/"):
                normalized = normalized[len(prefix) + 1 :]
                break

        return f"/artifacts/{normalized}"
    
    async def upload_file(
        self,
        local_file_path: str,
        organization_id: int,
        project_id: int,
        test_run_id: int,
        filename: Optional[str] = None,
    ) -> Optional[str]:
        """
        Upload a file to storage.
        
        Args:
            local_file_path: Path to the local file
            organization_id: Organization ID
            project_id: Project ID
            test_run_id: Test run ID
            filename: Optional custom filename (defaults to original filename)
            
        Returns:
            URL or path to the uploaded file
        """
        local_path = Path(local_file_path)
        if not local_path.exists():
            return None
        
        filename = filename or local_path.name
        storage_path = self._generate_path(
            organization_id, project_id, test_run_id, filename
        )
        
        if self.provider == "gcs" and self._bucket:
            return await self._upload_to_gcs(local_path, storage_path)
        if self.provider == "s3" and self._s3_client and self.s3_bucket:
            return await self._upload_to_s3(local_path, storage_path)
        else:
            return self._upload_local(local_path, storage_path)
    
    async def _upload_to_gcs(self, local_path: Path, storage_path: str) -> Optional[str]:
        """Upload a file to Google Cloud Storage."""
        try:
            blob = self._bucket.blob(storage_path)
            blob.upload_from_filename(str(local_path))
            
            # Return public URL or signed URL
            return f"gs://{self.gcs_bucket}/{storage_path}"
        except Exception as e:
            logger.exception("Failed to upload to GCS")
            return None

    async def _upload_to_s3(self, local_path: Path, storage_path: str) -> Optional[str]:
        """Upload a file to S3-compatible storage."""
        try:
            self._s3_client.upload_file(str(local_path), self.s3_bucket, storage_path)
            return f"s3://{self.s3_bucket}/{storage_path}"
        except Exception:
            logger.exception("Failed to upload to S3")
            return None

    def _upload_local(self, local_path: Path, storage_path: str) -> Optional[str]:
        """Copy a file to local storage."""
        try:
            dest_path = self.local_path / storage_path
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(local_path, dest_path)
            return self._public_artifact_path(storage_path)
        except Exception:
            logger.exception("Failed to save artifact locally")
            return None
    
    async def upload_screenshot(
        self,
        screenshot_path: str,
        organization_id: int,
        project_id: int,
        test_run_id: int,
        description: Optional[str] = None,
    ) -> Optional[str]:
        """Upload a screenshot."""
        filename = Path(screenshot_path).name
        if description:
            # Add description to filename
            stem = Path(screenshot_path).stem
            suffix = Path(screenshot_path).suffix
            safe_description = "".join(c if c.isalnum() else "_" for c in description)[:50]
            filename = f"{stem}_{safe_description}{suffix}"
        
        return await self.upload_file(
            screenshot_path,
            organization_id,
            project_id,
            test_run_id,
            filename,
        )
    
    async def upload_video(
        self,
        video_path: str,
        organization_id: int,
        project_id: int,
        test_run_id: int,
    ) -> Optional[str]:
        """Upload a video recording."""
        return await self.upload_file(
            video_path,
            organization_id,
            project_id,
            test_run_id,
            f"recording_{test_run_id}.webm",
        )
    
    async def upload_logs(
        self,
        logs_path: str,
        organization_id: int,
        project_id: int,
        test_run_id: int,
    ) -> Optional[str]:
        """Upload log files."""
        return await self.upload_file(
            logs_path,
            organization_id,
            project_id,
            test_run_id,
        )
    
    def get_download_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get a download URL for a stored file.
        
        Args:
            storage_path: Path in storage
            expires_in: URL expiration time in seconds (for GCS signed URLs)
            
        Returns:
            URL to download the file
        """
        if self.provider == "gcs" and self._bucket:
            try:
                blob = self._bucket.blob(storage_path)
                return blob.generate_signed_url(expiration=expires_in)
            except Exception:
                return None
        if self.provider == "s3" and self._s3_client and self.s3_bucket:
            try:
                return self._s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.s3_bucket, "Key": storage_path},
                    ExpiresIn=expires_in,
                )
            except Exception:
                return None
        else:
            normalized_path = storage_path.removeprefix("/artifacts/")
            full_path = self.local_path / normalized_path
            if full_path.exists():
                return self._public_artifact_path(normalized_path)
            return None


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create the global storage service."""
    global _storage_service
    if _storage_service is None:
        from apps.api.config import settings
        
        _storage_service = StorageService(
            provider=settings.storage_provider,
            local_path=settings.storage_local_path,
            gcs_bucket=settings.gcs_bucket_name,
            gcs_prefix=settings.storage_gcs_prefix,
            s3_bucket=settings.s3_bucket_name,
            s3_prefix=settings.s3_prefix,
            s3_region=settings.s3_region,
        )
    return _storage_service
