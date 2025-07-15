
import { useState, useEffect } from 'react';

interface UseGreetingResult {
  greeting: string;
  motivationalMessage: string;
}

export const useGreeting = (userName: string = "Contador"): UseGreetingResult => {
  const [greeting, setGreeting] = useState("");
  const [motivationalMessage, setMotivationalMessage] = useState("");
  
  // Frases motivacionais para diferentes momentos do dia
  const morningMotivations = [
    "É hora de começar com todo o gás! Hoje será um dia produtivo!",
    "Um novo dia, novas oportunidades para brilhar!",
    "Uma ótima manhã pode transformar todo o seu dia!",
    "Cada proposta fechada hoje é um degrau na sua carreira!"
  ];
  
  const afternoonMotivations = [
    "Mantenha o foco! A tarde é excelente para fechar negócios!",
    "Você já fez muito hoje, mas o melhor ainda está por vir!",
    "Continue com esse ritmo! Você está indo muito bem!",
    "Não deixe a energia cair! Grandes resultados estão chegando!"
  ];
  
  const eveningMotivations = [
    "Revise seus resultados e celebre suas conquistas de hoje!",
    "Um dia produtivo merece um ótimo descanso!",
    "Prepare-se para amanhã e orgulhe-se do que fez hoje!",
    "Os melhores profissionais sempre planejam o dia seguinte!"
  ];
  
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    let motivations;
    
    if (hour < 12) {
      setGreeting(`Bom dia, ${userName}!`);
      motivations = morningMotivations;
    } else if (hour < 18) {
      setGreeting(`Boa tarde, ${userName}!`);
      motivations = afternoonMotivations;
    } else {
      setGreeting(`Boa noite, ${userName}!`);
      motivations = eveningMotivations;
    }
    
    // Selecionar uma mensagem motivacional aleatória
    const randomIndex = Math.floor(Math.random() * motivations.length);
    setMotivationalMessage(motivations[randomIndex]);
  }, [userName]);
  
  return { greeting, motivationalMessage };
};
