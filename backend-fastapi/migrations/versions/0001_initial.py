"""Initial multi-tenant schema."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("tenants", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("slug", sa.String(80), nullable=False, unique=True), sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)
    op.create_table("users", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("email", sa.String(254), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("role", sa.String(30), nullable=False), sa.Column("active", sa.Boolean(), nullable=False), sa.UniqueConstraint("tenant_id", "email"))
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])
    op.create_table("categories", sa.Column("id", sa.String(80), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("name", sa.String(100), nullable=False), sa.Column("icon", sa.String(40), nullable=False), sa.Column("sort_order", sa.Integer(), nullable=False), sa.Column("active", sa.Boolean(), nullable=False), sa.UniqueConstraint("tenant_id", "name"))
    op.create_index("ix_categories_tenant_id", "categories", ["tenant_id"])
    op.create_table("products", sa.Column("id", sa.String(80), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("category_id", sa.String(80), sa.ForeignKey("categories.id"), nullable=False), sa.Column("name", sa.String(140), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("price", sa.Numeric(10, 2), nullable=False), sa.Column("image_url", sa.Text()), sa.Column("ingredients", postgresql.JSONB(), nullable=False), sa.Column("additions", postgresql.JSONB(), nullable=False), sa.Column("allergens", postgresql.JSONB(), nullable=False), sa.Column("available", sa.Boolean(), nullable=False), sa.Column("active", sa.Boolean(), nullable=False))
    op.create_index("ix_products_tenant_id", "products", ["tenant_id"])
    op.create_table("orders", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("code", sa.String(3), nullable=False), sa.Column("status", sa.Enum("awaiting_payment", "paid", "preparing", "ready", "completed", "cancelled", name="orderstatus"), nullable=False), sa.Column("total", sa.Numeric(10, 2), nullable=False), sa.Column("cpf", sa.String(11)), sa.Column("invoice_email", sa.String(254)), sa.Column("kiosk_id", sa.String(100)), sa.Column("idempotency_key", sa.String(100), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False), sa.UniqueConstraint("tenant_id", "idempotency_key"))
    op.create_index("ix_orders_tenant_id", "orders", ["tenant_id"])
    op.create_table("order_items", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False), sa.Column("product_id", sa.String(80), sa.ForeignKey("products.id"), nullable=False), sa.Column("product_name", sa.String(140), nullable=False), sa.Column("unit_price", sa.Numeric(10, 2), nullable=False), sa.Column("quantity", sa.Integer(), nullable=False), sa.Column("removed_ingredients", postgresql.JSONB(), nullable=False), sa.Column("additions", postgresql.JSONB(), nullable=False), sa.Column("notes", sa.Text(), nullable=False))
    op.create_index("ix_order_items_tenant_id", "order_items", ["tenant_id"])
    op.create_table("payments", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False, unique=True), sa.Column("provider_id", sa.String(100)), sa.Column("status", sa.Enum("pending", "approved", "rejected", "cancelled", "expired", name="paymentstatus"), nullable=False), sa.Column("amount", sa.Numeric(10, 2), nullable=False), sa.Column("qr_code", sa.Text()), sa.Column("qr_code_base64", sa.Text()), sa.Column("ticket_url", sa.Text()), sa.Column("raw_webhook", postgresql.JSONB()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_payments_tenant_id", "payments", ["tenant_id"])
    op.create_index("ix_payments_provider_id", "payments", ["provider_id"])
    op.create_table("fiscal_documents", sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False), sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False, unique=True), sa.Column("status", sa.Enum("requested", "processing", "issued", "failed", name="fiscalstatus"), nullable=False), sa.Column("email", sa.String(254), nullable=False), sa.Column("provider_id", sa.String(120)), sa.Column("access_key", sa.String(60)), sa.Column("pdf_url", sa.Text()), sa.Column("xml_url", sa.Text()), sa.Column("error_detail", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.create_index("ix_fiscal_documents_tenant_id", "fiscal_documents", ["tenant_id"])


def downgrade():
    op.drop_table("fiscal_documents")
    op.drop_index("ix_payments_provider_id", table_name="payments")
    op.drop_table("payments")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_table("users")
    op.drop_index("ix_tenants_slug", table_name="tenants")
    op.drop_table("tenants")
    for name in ("fiscalstatus", "paymentstatus", "orderstatus"):
        sa.Enum(name=name).drop(op.get_bind(), checkfirst=True)
