import logging
import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
import httpx
from app.config import get_settings
from app.routers import auth, catalog, orders, admin, webhooks, users, public
from app.billing_rules import billing_loop


logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(billing_loop())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError): await task


app = FastAPI(title='FastLanches API', version='1.0.0', docs_url='/docs', openapi_url='/openapi.json', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().origins, allow_credentials=True,
                   allow_methods=['GET','POST','PUT','PATCH','DELETE'], allow_headers=['Authorization','Content-Type','Idempotency-Key'])


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={'detail': 'Dados inválidos', 'errors': [
        {'loc': list(e['loc']), 'msg': e['msg']} for e in exc.errors()]})


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    logging.getLogger(__name__).warning('Database constraint rejected request: %s', type(exc.orig).__name__)
    return JSONResponse(status_code=409, content={'detail': 'Conflito de dados'})


@app.exception_handler(httpx.HTTPError)
async def provider_error(request: Request, exc: httpx.HTTPError):
    logging.getLogger(__name__).error('External provider failed: %s', type(exc).__name__)
    return JSONResponse(status_code=502, content={'detail': 'Integração externa indisponível'})


@app.get('/health')
async def health(): return {'ok': True}


app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(admin.router, prefix='/api/v1')
app.include_router(admin.router, include_in_schema=False)
app.include_router(webhooks.router)
app.include_router(users.router)
app.include_router(public.router)
