"""boleto provider fields

Revision ID: 0003_boleto_fields
Revises: 0002_password_reset
"""
from alembic import op
import sqlalchemy as sa

revision = '0003_boleto_fields'
down_revision = '0002_password_reset'
branch_labels = None
depends_on = None


def upgrade():
    columns = {column['name'] for column in sa.inspect(op.get_bind()).get_columns('billing_invoices')}
    if 'boleto_url' not in columns:
        op.add_column('billing_invoices', sa.Column('boleto_url', sa.Text()))
    if 'barcode' not in columns:
        op.add_column('billing_invoices', sa.Column('barcode', sa.Text()))


def downgrade():
    columns = {column['name'] for column in sa.inspect(op.get_bind()).get_columns('billing_invoices')}
    if 'barcode' in columns:
        op.drop_column('billing_invoices', 'barcode')
    if 'boleto_url' in columns:
        op.drop_column('billing_invoices', 'boleto_url')
