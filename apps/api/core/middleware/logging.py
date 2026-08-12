"""
Request logging middleware.
"""
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        # Calculate request duration
        duration = time.time() - start_time
        duration_ms = round(duration * 1000, 2)
        
        # Log the request
        print(
            f"{request.method} {request.url.path} "
            f"- Status: {response.status_code} "
            f"- Duration: {duration_ms}ms"
        )
        
        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms}ms"
        
        return response
