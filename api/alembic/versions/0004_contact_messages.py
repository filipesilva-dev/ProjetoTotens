"""public contact messages

Revision ID: 0004_contact_messages
Revises: 0003_boleto_fields
"""
from alembic import op
import sqlalchemy as sa

revision = '0004_contact_messages'
down_revision = '0003_boleto_fields'
branch_labels = None
depends_on = None


def upgrade():
    if sa.inspect(op.get_bind()).has_table('contact_messages'):
        return
    op.create_table('contact_messages',
                    sa.Column('id', sa.Uuid(), primary_key=True),
                    sa.Column('tenant_id', sa.Uuid(), sa.ForeignKey('tenants.id')),
                    sa.Column('name', sa.String(180), nullable=False),
                    sa.Column('email', sa.String(320), nullable=False),
                    sa.Column('message', sa.Text(), nullable=False),
                    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False))
    op.create_index('ix_contact_tenant_created', 'contact_messages', ['tenant_id', 'created_at'])


def downgrade():
    if sa.inspect(op.get_bind()).has_table('contact_messages'):
        op.drop_index('ix_contact_tenant_created', table_name='contact_messages')
        op.drop_table('contact_messages')
