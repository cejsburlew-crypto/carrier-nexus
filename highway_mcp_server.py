#!/usr/bin/env python3
"""
highway_mcp_server.py — Highway.com MCP Server for Carrier Nexus
Exposes Highway carrier portal data as MCP tools for Claude Desktop.

Highway Internal API: https://highway.com/monitor/api/v1/
Auth: Session cookie (obtain by logging in to highway.com)
Company ID: 300823 (CARRIER TRUCKING US LLC)

Setup:
  pip install mcp httpx

Claude Desktop config (~/.config/claude-desktop/claude_desktop_config.json):
  {
    "mcpServers": {
      "highway": {
        "command": "python3",
        "args": ["/path/to/highway_mcp_server.py"],
        "env": {
          "HIGHWAY_SESSION_COOKIE": "your_session_cookie_value",
          "HIGHWAY_COMPANY_ID": "300823"
        }
      }
    }
  }

To get your session cookie:
  1. Log into highway.com in Chrome
  2. Open DevTools (F12) → Application → Cookies → highway.com
  3. Copy the value of '_highway_session' cookie
  4. Set as HIGHWAY_SESSION_COOKIE environment variable
"""

import asyncio
import json
import os
import sys
from typing import Optional

import httpx
import mcp.server.stdio
import mcp.types as types
from mcp.server import Server

BASE_URL = "https://highway.com"

server = Server("highway-nexus")


async def highway_request(endpoint: str, params: dict = None) -> dict:
    """Make an authenticated request to the Highway.com API."""
    cookie = os.environ.get("HIGHWAY_SESSION_COOKIE", "")
    company_id = os.environ.get("HIGHWAY_COMPANY_ID", "300823")

    if not cookie:
        return {
            "error": "HIGHWAY_SESSION_COOKIE not set. Please configure this environment variable.",
            "hint": "Log into highway.com, open DevTools → Application → Cookies, copy '_highway_session' value."
        }

    headers = {
        "Cookie": f"_highway_session={cookie}",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "CarrierNexus/1.0",
        "Referer": "https://highway.com/monitor",
    }

    if params is None:
        params = {}

    # Always inject company_id where relevant
    if "q[company_id_eq]" not in params:
        params["q[company_id_eq]"] = company_id

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            r = await client.get(
                f"{BASE_URL}{endpoint}",
                headers=headers,
                params=params,
            )

            if r.status_code == 401:
                return {
                    "error": "Session expired. Please update HIGHWAY_SESSION_COOKIE.",
                    "hint": "Log into highway.com → DevTools → Application → Cookies → copy '_highway_session'"
                }
            if r.status_code == 403:
                return {"error": "Access forbidden. Your account may not have permission for this resource."}
            if r.status_code == 404:
                return {"error": f"Endpoint not found: {endpoint}"}
            if r.status_code == 429:
                return {"error": "Rate limited by Highway.com. Please wait before retrying."}

            r.raise_for_status()

            try:
                return r.json()
            except Exception:
                return {"raw_text": r.text[:2000], "status_code": r.status_code}

    except httpx.ConnectError:
        return {"error": "Could not connect to highway.com. Check your internet connection."}
    except httpx.TimeoutException:
        return {"error": "Request to highway.com timed out (15s). Try again."}
    except httpx.HTTPStatusError as e:
        return {"error": f"HTTP {e.response.status_code}: {e.response.text[:500]}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_loads",
            description="Retrieve loads from Highway.com. Filter by status (e.g. 'active', 'delivered', 'pending'). Returns load details including origin, destination, driver, pickup score status.",
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by load status. Common values: 'active', 'delivered', 'pending', 'cancelled'.",
                    },
                    "page": {"type": "integer", "description": "Page number (default 1)", "default": 1},
                    "per_page": {"type": "integer", "description": "Results per page (default 50, max 100)", "default": 50},
                },
            },
        ),
        types.Tool(
            name="get_equipment",
            description="Retrieve fleet equipment and ELD integration status from Highway.com. Shows trucks, VINs, ELD connection status, COI status.",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="get_pickup_score",
            description="Get the Verified Pickup Score (VPS) for Carrier Trucking US LLC. Returns the percentage of loads where pickup was detected via ELD/GPS, plus comparison to industry average (72%).",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="get_broker_connections",
            description="List all brokers connected to your Highway.com profile. Shows broker name, MC number, connection status, and load history.",
            inputSchema={
                "type": "object",
                "properties": {
                    "page": {"type": "integer", "description": "Page number (default 1)", "default": 1},
                },
            },
        ),
        types.Tool(
            name="get_offers",
            description="Retrieve load offers from brokers on Highway.com. Tab can be 'action' (needs response), 'accepted', 'rejected', or 'all'.",
            inputSchema={
                "type": "object",
                "properties": {
                    "tab": {
                        "type": "string",
                        "description": "Offer tab: 'action' (default, needs response), 'accepted', 'rejected', 'all'",
                        "default": "action",
                    },
                },
            },
        ),
        types.Tool(
            name="get_rate_confirmations",
            description="Retrieve rate confirmations from Highway.com. Can filter by status or broker name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "description": "Filter by status: 'pending', 'active', 'completed', 'cancelled'",
                    },
                    "broker": {
                        "type": "string",
                        "description": "Filter by broker name (partial match)",
                    },
                },
            },
        ),
        types.Tool(
            name="get_capacity_postings",
            description="Get capacity postings (truck availability postings) on Highway.com. Shows posted trucks available for loads.",
            inputSchema={
                "type": "object",
                "properties": {
                    "tab": {
                        "type": "string",
                        "description": "Tab: 'active' (default), 'expired', 'all'",
                        "default": "active",
                    },
                },
            },
        ),
        types.Tool(
            name="get_users",
            description="List users associated with the carrier account on Highway.com. Shows dispatchers, drivers, and admins.",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="get_dispatcher_connections",
            description="List dispatcher connections on Highway.com — third-party dispatchers who have access to your carrier profile.",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="search_loads",
            description="Search for available loads on Highway.com's TFX (freight exchange). Specify origin, destination, equipment type, and pickup date range.",
            inputSchema={
                "type": "object",
                "properties": {
                    "origin": {
                        "type": "string",
                        "description": "Origin city and state, e.g. 'Chicago, IL' or 'Chicago IL'",
                    },
                    "destination": {
                        "type": "string",
                        "description": "Destination city and state (optional)",
                    },
                    "equipment_type": {
                        "type": "string",
                        "description": "Equipment type: 'Van', 'Reefer', 'Flatbed', 'Power Only', 'Step Deck', 'Conestoga'",
                    },
                    "pickup_date_start": {
                        "type": "string",
                        "description": "Pickup date start (YYYY-MM-DD format)",
                    },
                    "pickup_date_end": {
                        "type": "string",
                        "description": "Pickup date end (YYYY-MM-DD format)",
                    },
                    "origin_dh": {
                        "type": "integer",
                        "description": "Deadhead miles from origin (default 150)",
                        "default": 150,
                    },
                    "dest_dh": {
                        "type": "integer",
                        "description": "Deadhead miles to destination (default 150)",
                        "default": 150,
                    },
                },
                "required": ["origin"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """Dispatch tool calls to the appropriate handler."""

    result = await _dispatch(name, arguments)
    return [types.TextContent(type="text", text=json.dumps(result, indent=2))]


async def _dispatch(name: str, args: dict) -> dict:
    company_id = os.environ.get("HIGHWAY_COMPANY_ID", "300823")

    if name == "get_loads":
        params = {
            "page": args.get("page", 1),
            "per_page": args.get("per_page", 50),
        }
        if args.get("status"):
            params["q[status_eq]"] = args["status"]
        params["q[s]"] = "created_at desc"
        data = await highway_request("/monitor/api/v1/loads", params)
        return data

    elif name == "get_equipment":
        params = {
            "q[company_id_eq]": company_id,
        }
        data = await highway_request("/monitor/connect/api/v1/integrations", params)
        return data

    elif name == "get_pickup_score":
        # Fetch loads and compute VPS (% where pickup_detected=true)
        params = {
            "per_page": 200,
            "q[s]": "created_at desc",
        }
        data = await highway_request("/monitor/api/v1/loads", params)
        if "error" in data:
            return data

        loads = data if isinstance(data, list) else data.get("loads", data.get("data", []))
        if not loads:
            return {
                "vps_score": None,
                "industry_average": 72,
                "message": "No loads found to compute VPS.",
                "raw": data
            }

        total = len(loads)
        detected = sum(1 for l in loads if l.get("pickup_detected") or l.get("eld_pickup_verified"))
        score = round((detected / total) * 100, 1) if total > 0 else 0

        return {
            "vps_score": score,
            "industry_average": 72,
            "total_loads_sampled": total,
            "pickup_detected_count": detected,
            "status": "above_average" if score >= 72 else "below_average",
            "message": f"VPS: {score}% (industry avg: 72%)"
        }

    elif name == "get_broker_connections":
        params = {
            "page": args.get("page", 1),
        }
        data = await highway_request("/monitor/api/v1/broker_connections", params)
        return data

    elif name == "get_offers":
        tab = args.get("tab", "action")
        params = {"tab": tab}
        data = await highway_request("/monitor/api/v1/offers", params)
        return data

    elif name == "get_rate_confirmations":
        params = {}
        if args.get("status"):
            params["q[status_eq]"] = args["status"]
        if args.get("broker"):
            params["q[broker_name_cont]"] = args["broker"]
        params["q[s]"] = "created_at desc"
        data = await highway_request("/monitor/api/v1/rate_confirmations", params)
        return data

    elif name == "get_capacity_postings":
        tab = args.get("tab", "active")
        params = {"tab": tab}
        data = await highway_request("/monitor/api/v1/potential_capacities", params)
        return data

    elif name == "get_users":
        data = await highway_request("/monitor/api/v1/users", {})
        return data

    elif name == "get_dispatcher_connections":
        data = await highway_request("/monitor/api/v1/dispatcher_connections", {})
        return data

    elif name == "search_loads":
        params = {
            "origin": args["origin"],
            "origin_dh": args.get("origin_dh", 150),
            "dest_dh": args.get("dest_dh", 150),
        }
        if args.get("destination"):
            params["destination"] = args["destination"]
        if args.get("equipment_type"):
            params["equipment_type"] = args["equipment_type"]
        if args.get("pickup_date_start"):
            params["q[pickup_date_gteq]"] = args["pickup_date_start"]
        if args.get("pickup_date_end"):
            params["q[pickup_date_lteq]"] = args["pickup_date_end"]
        data = await highway_request("/monitor/api/v1/load_searches", params)
        return data

    else:
        return {"error": f"Unknown tool: {name}"}


async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
