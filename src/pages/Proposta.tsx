// 1. Função utilitária para tratar datas vazias
const formatDateForDatabase = (dateValue) => {
  if (!dateValue || dateValue === "" || dateValue === null || dateValue === undefined) {
    return null;
  }
  
  // Verifica se a data é válida
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return dateValue;
};

// 2. Atualizar o onSubmitNewProposal
const onSubmitNewProposal = async (values) => {
  try {
    // Processar os dados antes de enviar
    const processedValues = {
      ...values,
      data_fechamento: formatDateForDatabase(values.data_fechamento),
      data_inicio: formatDateForDatabase(values.data_inicio),
      // Garantir que campos numéricos sejam números ou null
      honorario: values.honorario ? Number(values.honorario) : 0,
      funcionarios: values.funcionarios ? Number(values.funcionarios) : 0,
      perda_valor: values.perda_valor ? Number(values.perda_valor) : 0,
      // Garantir que campos de texto vazios sejam null
      nome_quem_indicou: values.nome_quem_indicou || null,
      reajuste_anual: values.reajuste_anual || null,
      observacoes: values.observacoes || null,
      tipo_cliente: values.tipo_cliente || null,
      comissao: values.comissao || null
    };

    // Verificar se é uma edição ou uma nova proposta
    if (selectedProposta) {
      const { data, error } = await supabase
        .from('propostas')
        .update({
          ...processedValues,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProposta.id);

      if (error) throw error;
      
      // Registrar evento de edição
      await registrarEvento(
        "edicao",
        "proposta",
        selectedProposta.id.toString(),
        `Proposta de entrada editada: ${values.cliente}`,
        { 
          cliente: values.cliente,
          honorario: values.honorario,
          status: values.status,
          responsavel: values.responsavel
        }
      );

      toast({
        title: "Proposta atualizada com sucesso!",
      });
    } else {
      // Criar uma nova proposta
      const { data, error } = await supabase
        .from('propostas')
        .insert([{
          ...processedValues,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      // Registrar evento de criação
      if (data && data[0]) {
        await registrarEvento(
          "criacao",
          "proposta",
          data[0].id.toString(),
          `Nova proposta de entrada criada: ${values.cliente}`,
          { 
            cliente: values.cliente,
            honorario: values.honorario,
            status: values.status,
            responsavel: values.responsavel
          }
        );
      }

      toast({
        title: "Proposta criada com sucesso!",
      });
    }

    // Fechar o diálogo e recarregar as propostas
    setOpenNewProposal(false);
    setSelectedProposta(null);
    fetchPropostas();
    form.reset();
  } catch (error) {
    console.error('Erro ao salvar proposta:', error);
    toast({
      title: "Erro ao salvar proposta",
      description: error.message,
      variant: "destructive",
    });
  }
};

// 3. Atualizar o onSubmitExitProposal
const onSubmitExitProposal = async (values) => {
  try {
    // Processar os dados antes de enviar
    const processedValues = {
      ...values,
      data_baixa: formatDateForDatabase(values.data_baixa),
      // Garantir que campos numéricos sejam números
      perda_valor: values.perda_valor ? Number(values.perda_valor) : 0,
      // Garantir que campos de texto vazios sejam null
      observacoes: values.observacoes || null,
      evento: values.evento || null,
      motivo: values.motivo || null
    };

    // Verificar se é uma edição ou uma nova proposta de saída
    if (selectedProposta && selectedProposta.tipo_proposta === 'saida') {
      const { data, error } = await supabase
        .from('propostas_saida')
        .update({
          ...processedValues,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProposta.id);

      if (error) throw error;
      
      // Registrar evento de edição
      await registrarEvento(
        "edicao",
        "proposta_saida",
        selectedProposta.id.toString(),
        `Proposta de saída editada: ${values.cliente}`,
        { 
          cliente: values.cliente,
          evento: values.evento,
          motivo: values.motivo,
          perda_valor: values.perda_valor
        }
      );

      toast({
        title: "Proposta de saída atualizada com sucesso!",
      });
    } else {
      // Criar uma nova proposta de saída
      const { data, error } = await supabase
        .from('propostas_saida')
        .insert([{
          ...processedValues,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      // Registrar evento de criação
      if (data && data[0]) {
        await registrarEvento(
          "criacao",
          "proposta_saida",
          data[0].id.toString(),
          `Nova proposta de saída criada: ${values.cliente}`,
          { 
            cliente: values.cliente,
            evento: values.evento,
            motivo: values.motivo,
            perda_valor: values.perda_valor
          }
        );
      }

      toast({
        title: "Proposta de saída criada com sucesso!",
      });
    }

    // Fechar o diálogo e recarregar as propostas
    setOpenExitProposal(false);
    setSelectedProposta(null);
    fetchPropostas();
    exitForm.reset();
  } catch (error) {
    console.error('Erro ao salvar proposta de saída:', error);
    toast({
      title: "Erro ao salvar proposta de saída",
      description: error.message,
      variant: "destructive",
    });
  }
};

// 4. Atualizar os valores padrão dos formulários
const form = useForm({
  defaultValues: {
    data: new Date().toISOString().split('T')[0],
    cliente: "",
    tipo_publico: "",
    origem: "",
    quem_indicou: "",
    nome_quem_indicou: "",
    comissao: "",
    responsavel: "",
    abertura_gratuita: false,
    tributacao: "",
    honorario: 0,
    funcionarios: 0,
    tipo_cliente: "",
    status: "em_analise",
    data_fechamento: "", // Manter como string vazia, será tratado na função
    data_inicio: "", // Manter como string vazia, será tratado na função
    reajuste_anual: "",
    observacoes: ""
  },
  mode: "onChange"
});

const exitForm = useForm({
  defaultValues: {
    data: new Date().toISOString().split('T')[0],
    cliente: "",
    evento: "",
    motivo: "",
    data_baixa: "", // Manter como string vazia, será tratado na função
    perda_valor: 0,
    observacoes: ""
  },
  mode: "onChange"
});

// 5. Atualizar a função handleEditProposta para tratar datas corretamente
const handleEditProposta = (proposta) => {
  if (!proposta || !proposta.id) {
    toast({
      title: "Erro ao editar",
      description: "Não foi possível carregar os dados desta proposta.",
      variant: "destructive"
    });
    return;
  }
  
  setSelectedProposta(proposta);
  
  if (proposta.tipo_proposta === "entrada") {
    form.reset({
      data: proposta.data,
      cliente: proposta.cliente,
      tipo_publico: proposta.tipo_publico,
      origem: proposta.origem,
      quem_indicou: proposta.quem_indicou || "",
      nome_quem_indicou: proposta.nome_quem_indicou || "",
      comissao: proposta.comissao || "",
      responsavel: proposta.responsavel,
      abertura_gratuita: proposta.abertura_gratuita || false,
      tributacao: proposta.tributacao,
      honorario: proposta.honorario,
      funcionarios: proposta.funcionarios || 0,
      tipo_cliente: proposta.tipo_cliente || "",
      status: proposta.status,
      // Tratar datas que podem ser null
      data_fechamento: proposta.data_fechamento || "",
      data_inicio: proposta.data_inicio || "",
      reajuste_anual: proposta.reajuste_anual || "",
      observacoes: proposta.observacoes || ""
    });
    setOpenNewProposal(true);
  } else {
    // Preencher formulário de saída
    exitForm.reset({
      data: proposta.data || new Date().toISOString().split('T')[0],
      cliente: proposta.cliente || "",
      evento: proposta.evento || "",
      motivo: proposta.motivo || "",
      // Tratar data que pode ser null
      data_baixa: proposta.data_baixa || "",
      perda_valor: proposta.perda_valor || 0,
      observacoes: proposta.observacoes || ""
    });
    setOpenExitProposal(true);
  }
};
