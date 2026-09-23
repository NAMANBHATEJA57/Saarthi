from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from jobspy import scrape_jobs
import pandas as pd
import math
import logging

app = FastAPI(title="Saarthi Job Scraper Service")

logger = logging.getLogger(__name__)

class ScrapeRequest(BaseModel):
    search_term: str
    location: str
    site_names: List[str] = ["indeed", "linkedin"]
    job_type: str = "fulltime" # fulltime, parttime, internship, contract
    is_remote: bool = False
    results_wanted: int = 20

def clean_value(val):
    if pd.isna(val) or (isinstance(val, float) and math.isnan(val)):
        return None
    return val

@app.post("/scrape")
def scrape(req: ScrapeRequest):
    try:
        jobs_df = scrape_jobs(
            site_name=req.site_names,
            search_term=req.search_term,
            location=req.location,
            results_wanted=req.results_wanted,
            is_remote=req.is_remote,
            job_type=req.job_type,
            country_dict={"indeed": "India"} if "india" in req.location.lower() else None
        )
        
        if jobs_df.empty:
            return {"jobs": []}
            
        jobs_list = []
        for _, row in jobs_df.iterrows():
            job = {
                "external_id": clean_value(row.get('id')),
                "title": clean_value(row.get('title')),
                "company": clean_value(row.get('company')),
                "company_url": clean_value(row.get('company_url')),
                "job_url": clean_value(row.get('job_url')),
                "location": clean_value(row.get('location')),
                "job_type": clean_value(row.get('job_type')),
                "date_posted": str(row.get('date_posted')) if clean_value(row.get('date_posted')) else None,
                "description": clean_value(row.get('description')),
                "salary_min": clean_value(row.get('min_amount')),
                "salary_max": clean_value(row.get('max_amount')),
                "salary_currency": clean_value(row.get('currency')),
                "salary_interval": clean_value(row.get('interval')),
                "source": clean_value(row.get('site')),
                "company_logo": clean_value(row.get('company_logo')),
            }
            jobs_list.append(job)
            
        return {"jobs": jobs_list}
        
    except Exception as e:
        logger.error(f"Error scraping jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
