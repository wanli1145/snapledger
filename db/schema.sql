-- 消费记忆智能体 · 数据库结构
-- 明细行带 VECTOR(1024) 嵌入列（当前用可复现本地 hash embedding；接 AWS Bedrock 后可替换为 Titan/Claude embedding），
-- 向量索引支撑「上个月买过几次咖啡」这类语义检索。

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  natural_key STRING UNIQUE,
  merchant STRING NOT NULL,
  tx_date DATE NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  source STRING NOT NULL DEFAULT 'scan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS natural_key STRING;
CREATE UNIQUE INDEX IF NOT EXISTS receipts_natural_key_idx ON receipts (natural_key) WHERE natural_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name STRING NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  category STRING NOT NULL,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS receipts_date_idx ON receipts (tx_date DESC);
CREATE INDEX IF NOT EXISTS items_category_idx ON receipt_items (category);

CREATE VECTOR INDEX IF NOT EXISTS items_embedding_idx ON receipt_items (embedding);
