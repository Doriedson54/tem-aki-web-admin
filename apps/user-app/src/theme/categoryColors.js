export const getCategoryColors = (categoryName) => {
  const schemes = {
    'Prestação de Serviços': {
      primary: '#e74c3c',
      secondary: '#c0392b',
      accent: '#fadbd8',
      border: '#e74c3c',
    },
    Comércio: {
      primary: '#27ae60',
      secondary: '#229954',
      accent: '#d5f4e6',
      border: '#27ae60',
    },
    Escolas: {
      primary: '#f39c12',
      secondary: '#e67e22',
      accent: '#fdeaa7',
      border: '#f39c12',
    },
    'Instituições Públicas': {
      primary: '#D0021B',
      secondary: '#e53e3e',
      accent: '#fed7d7',
      border: '#D0021B',
    },
    'Instituições Comunitárias': {
      primary: '#9013FE',
      secondary: '#a855f7',
      accent: '#f3e8ff',
      border: '#9013FE',
    },
    'Instituições Religiosas': {
      primary: '#50E3C2',
      secondary: '#4dd0b1',
      accent: '#e6fffa',
      border: '#50E3C2',
    },
  };

  return schemes[categoryName] || {
    primary: '#A0522D',
    secondary: '#D2691E',
    accent: '#F5DEB3',
    border: '#A0522D',
  };
};

