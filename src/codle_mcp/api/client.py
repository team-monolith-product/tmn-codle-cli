from typing import Any

import httpx

from codle_mcp.config import settings


class CodleAPIError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"Codle API error {status_code}: {detail}")


class CodleClient:
    """jce-class-rails Admin API 클라이언트."""

    def __init__(self):
        self.base_url = settings.codle_api_url.rstrip("/")
        self.token = settings.codle_admin_token
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": self.token,
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json",
            },
            timeout=30.0,
        )

    async def _request(self, method: str, path: str, **kwargs) -> dict[str, Any]:
        response = await self._client.request(method, path, **kwargs)
        if not response.is_success:
            raise CodleAPIError(response.status_code, response.text)
        if response.status_code == 204:
            return {}
        return response.json()

    # --- Materials ---

    async def list_materials(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/materials", params=params)

    async def get_material(self, material_id: str, params: dict | None = None) -> dict:
        return await self._request("GET", f"/admin/v1/materials/{material_id}", params=params)

    async def create_material(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/materials", json=data)

    async def update_material(self, material_id: str, data: dict) -> dict:
        return await self._request("PUT", f"/admin/v1/materials/{material_id}", json=data)

    async def duplicate_material(self, material_id: str) -> dict:
        return await self._request("POST", f"/admin/v1/materials/{material_id}/duplicate")

    async def delete_material(self, material_id: str) -> dict:
        return await self._request("DELETE", f"/admin/v1/materials/{material_id}")

    # --- Problems ---

    async def list_problems(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/problems", params=params)

    async def get_problem(self, problem_id: str, params: dict | None = None) -> dict:
        return await self._request("GET", f"/admin/v1/problems/{problem_id}", params=params)

    async def create_problem(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/problems", json=data)

    async def update_problem(self, problem_id: str, data: dict) -> dict:
        return await self._request("PUT", f"/admin/v1/problems/{problem_id}", json=data)

    async def duplicate_problem(self, problem_id: str) -> dict:
        return await self._request("POST", f"/admin/v1/problems/{problem_id}/duplicate")

    # --- Activities ---

    async def list_activities(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/activities", params=params)

    async def create_activity(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/activities", json=data)

    async def update_activity(self, activity_id: str, data: dict) -> dict:
        return await self._request("PUT", f"/admin/v1/activities/{activity_id}", json=data)

    async def create_many_activities(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/activities/create_many", json=data)

    async def update_many_activities(self, data: dict) -> dict:
        return await self._request("PUT", "/admin/v1/activities/update_many", json=data)

    # --- Material Bundles ---

    async def list_material_bundles(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/material_bundles", params=params)

    async def get_material_bundle(self, bundle_id: str, params: dict | None = None) -> dict:
        return await self._request("GET", f"/admin/v1/material_bundles/{bundle_id}", params=params)

    async def create_material_bundle(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/material_bundles", json=data)

    async def update_material_bundle(self, bundle_id: str, data: dict) -> dict:
        return await self._request("PUT", f"/admin/v1/material_bundles/{bundle_id}", json=data)

    async def delete_material_bundle(self, bundle_id: str) -> dict:
        return await self._request("DELETE", f"/admin/v1/material_bundles/{bundle_id}")

    # --- Tags ---

    async def list_tags(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/tags", params=params)

    # --- Problem Collections ---

    async def list_problem_collections(self, params: dict | None = None) -> dict:
        return await self._request("GET", "/admin/v1/problem_collections", params=params)

    # --- Quiz Activities ---

    async def create_quiz_activity(self, data: dict) -> dict:
        return await self._request("POST", "/admin/v1/quiz_activities", json=data)

    async def update_quiz_activity(self, activity_id: str, data: dict) -> dict:
        return await self._request("PUT", f"/admin/v1/quiz_activities/{activity_id}", json=data)

    async def close(self):
        await self._client.aclose()


client = CodleClient()
