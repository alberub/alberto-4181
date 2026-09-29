export const snails = [
  { id: 'm', name: 'Meteoro', color: '#265b43' },
  { id: 'l', name: 'Lechuga', color: '#588566' },
  { id: 't', name: 'Turbo', color: '#8ca787' },
  { id: 'c', name: 'Canela', color: '#a48467' },
  { id: 'r', name: 'Rayo', color: '#929b96' },
  { id: 'p', name: 'Pistacho', color: '#b9c6ae' },
];
export const races = [
  { number: 1, time: '09:00', winnerId: 'm' },
  { number: 2, time: '10:00', winnerId: 'l' },
  { number: 3, time: '11:00', winnerId: 'm' },
  { number: 4, time: '12:00', winnerId: 't' },
  { number: 5, time: '13:00', winnerId: 'c' },
  { number: 6, time: '14:00', winnerId: 'm' },
];
export const raceStats = snails.map((snail) => ({
  ...snail,
  wins: races.filter((race) => race.winnerId === snail.id).length,
}));
export const bets = races.map((race, index) => ({
  race: race.number,
  won: [0, 2, 3, 5].includes(index),
}));
export const betStats = [
  { name: 'Ganadas', value: bets.filter((bet) => bet.won).length },
  { name: 'Perdidas', value: bets.filter((bet) => !bet.won).length },
];
export const money = (cents: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
