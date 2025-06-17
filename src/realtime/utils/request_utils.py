import aiohttp
import asyncio

from loguru import logger


async def post_data_with_retry(url, json=None, retries=15, delay=3) -> dict:
    if json is None:
        json = {}

    async with aiohttp.ClientSession() as session:
        for attempt in range(retries):
            try:
                logger.info(f"Attempt {attempt + 1} to fetch data...")
                async with session.post(url=url, json=json) as resp:
                    if resp.status == 200:
                        return await resp.json()
            except aiohttp.ClientError as e:
                logger.warning(f"Request failed: {e}")
            # Wait before retrying
            if attempt < retries - 1:
                await asyncio.sleep(delay)

    raise Exception(f"Failed to post data after {retries} attempts.")
