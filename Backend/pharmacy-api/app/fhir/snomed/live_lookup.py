import requests

class LiveSNOMEDLookup:
    BASE_URL = "https://snowstorm.ihtsdotools.org/fhir/ValueSet/$expand"

    @staticmethod
    def search_concept_by_name(name: str, system: str = "http://snomed.info/sct") -> dict:
        """
        Search SNOMED CT concept by name using Snowstorm API.
        Returns dict with 'code' and 'display' or None if not found.
        """
        params = {
            "url": system,
            "filter": name,
            "_count": 1
        }
        headers = {"Accept": "application/fhir+json"}

        response = requests.get(LiveSNOMEDLookup.BASE_URL, params=params, headers=headers)

        if response.status_code != 200:
            raise ValueError(f"SNOMED search failed: {response.status_code}")

        result = response.json()
        contains = result.get("expansion", {}).get("contains", [])
        if not contains:
            return None

        concept = contains[0]
        return {"code": concept["code"], "display": concept["display"]}
