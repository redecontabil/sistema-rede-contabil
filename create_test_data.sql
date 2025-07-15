-- Script to insert 10 fictitious records into the custos table

-- Deleting test data (if you want to clean up later)
-- DELETE FROM custos WHERE id LIKE 'TEST-%';

-- Inserting 10 test records
INSERT INTO custos (
  id, 
  vencimento, 
  competencia, 
  previsto_para, 
  data_pagamento, 
  cpf_cnpj, 
  nome, 
  descricao, 
  referencia, 
  categoria, 
  detalhamento, 
  centro_custo, 
  valor_categoria, 
  identificador, 
  conta
) VALUES
  ('TEST-001', '2024-06-15', '2024-06', '2024-06-15', '2024-06-14', '12.345.678/0001-90', 'Fornecedor ABC Ltda', 'Aluguel do escritório - Junho 2024', 'NF-123456', 'Infraestrutura', 'Pagamento mensal de aluguel do escritório principal', 'Administrativo', 5800.00, 'ALG-24-06', 'Itaú 12345-6'),
  
  ('TEST-002', '2024-06-20', '2024-06', '2024-06-20', NULL, '98.765.432/0001-21', 'Materiais Escritório SA', 'Material de escritório - Junho 2024', 'NF-789012', 'Material de Consumo', 'Papelaria, cartuchos de impressora, canetas', 'Administrativo', 1250.75, 'MAT-24-06', 'Bradesco 7890-1'),
  
  ('TEST-003', '2024-06-25', '2024-06', '2024-06-25', NULL, '23.456.789/0001-34', 'TechSupport Informática', 'Manutenção servidores', 'OS-456789', 'TI', 'Manutenção preventiva nos servidores e backup de dados', 'TI', 3400.00, 'TI-24-06-01', 'Santander 5678-9'),
  
  ('TEST-004', '2024-06-10', '2024-06', '2024-06-10', '2024-06-09', '34.567.890/0001-45', 'Limpeza Total Serviços', 'Serviço de limpeza - Junho 2024', 'NF-345678', 'Serviços Gerais', 'Serviço mensal de limpeza e conservação do escritório', 'Administrativo', 2200.00, 'LIM-24-06', 'Caixa 3456-7'),
  
  ('TEST-005', '2024-06-30', '2024-06', '2024-06-30', NULL, '45.678.901/0001-56', 'Águas Claras Distribuidora', 'Conta de água - Junho 2024', 'FAT-234567', 'Utilidades', 'Fatura mensal de consumo de água', 'Administrativo', 450.30, 'AGU-24-06', 'Itaú 12345-6'),
  
  ('TEST-006', '2024-06-18', '2024-06', '2024-06-18', '2024-06-17', '56.789.012/0001-67', 'Energia Elétrica SA', 'Conta de energia - Junho 2024', 'FAT-345678', 'Utilidades', 'Fatura mensal de consumo de energia elétrica', 'Administrativo', 1850.45, 'ENE-24-06', 'Bradesco 7890-1'),
  
  ('TEST-007', '2024-06-22', '2024-06', '2024-06-22', NULL, '67.890.123/0001-78', 'Telecom Brasil', 'Internet e telefonia - Junho 2024', 'FAT-456789', 'Telecomunicações', 'Serviços de internet fibra 500mb e telefonia fixa', 'TI', 899.90, 'TEL-24-06', 'Santander 5678-9'),
  
  ('TEST-008', '2024-06-05', '2024-06', '2024-06-05', '2024-06-05', '78.901.234/0001-89', 'Café Express Ltda', 'Suprimentos copa - Junho 2024', 'NF-567890', 'Material de Consumo', 'Café, açúcar, adoçante e copos descartáveis', 'Administrativo', 580.25, 'CAF-24-06', 'Caixa 3456-7'),
  
  ('TEST-009', '2024-06-28', '2024-06', '2024-06-28', NULL, '89.012.345/0001-90', 'Seguros Proteção Total', 'Seguro predial - Junho 2024', 'APL-678901', 'Seguros', 'Parcela mensal do seguro do imóvel', 'Financeiro', 1200.00, 'SEG-24-06', 'Itaú 12345-6'),
  
  ('TEST-010', '2024-06-15', '2024-06', '2024-06-15', '2024-06-13', '90.123.456/0001-01', 'Marketing Digital Ltda', 'Campanha marketing digital - Junho 2024', 'NF-789012', 'Marketing', 'Investimento em anúncios nas redes sociais e Google Ads', 'Marketing', 3500.00, 'MKT-24-06', 'Bradesco 7890-1'); 