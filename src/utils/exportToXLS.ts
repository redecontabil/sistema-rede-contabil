
export function exportToXLS(data: any[], filename: string) {
  // Criar um array com cabeçalhos (chaves do objeto)
  const headers = Object.keys(data[0] || {});
  
  // Criar linhas de dados
  const rows = data.map(item => 
    headers.map(header => {
      // Formatar números como moeda se necessário
      if (header === 'honorario' && typeof item[header] === 'number') {
        return `R$ ${item[header].toFixed(2)}`;
      }
      return item[header];
    })
  );
  
  // Criar o conteúdo CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Criar um Blob
  const blob = new Blob([csvContent], { type: 'application/csv' });
  
  // Criar URL para download
  const url = window.URL.createObjectURL(blob);
  
  // Criar um elemento <a> para trigger o download
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  a.click();
  
  // Limpar URL após download
  window.URL.revokeObjectURL(url);
  
  return true;
}
