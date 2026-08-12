import asyncio
import asyncpg
import sys

async def main():
    try:
        conn = await asyncpg.connect('postgresql://postgres.kvlfgzqzcaeahpzvhwms:ozNJGsRRUDmNktzf@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
        print("Connected successfully to 5432!")
        await conn.close()
    except Exception as e:
        print(f"Error on 5432: {type(e).__name__}: {e}")

    try:
        conn = await asyncpg.connect('postgresql://postgres.kvlfgzqzcaeahpzvhwms:ozNJGsRRUDmNktzf@aws-1-ap-south-1.pooler.supabase.com:6543/postgres')
        print("Connected successfully to 6543!")
        await conn.close()
    except Exception as e:
        print(f"Error on 6543: {type(e).__name__}: {e}")

asyncio.run(main())
