"""single use password reset tokens

Revision ID: 0002_password_reset
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = '0002_password_reset'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # The initial revision builds the complete model metadata on fresh installs.
    # Older databases still need this table when advancing from revision 0001.
    if sa.inspect(op.get_bind()).has_table('password_reset_tokens'):
        return
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('user_id', sa.Uuid(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_reset_user_expires', 'password_reset_tokens', ['user_id', 'expires_at'])


def downgrade():
    if sa.inspect(op.get_bind()).has_table('password_reset_tokens'):
        op.drop_index('ix_reset_user_expires', table_name='password_reset_tokens')
        op.drop_table('password_reset_tokens')
