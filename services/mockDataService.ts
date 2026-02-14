import { Tank, TankStatus, Reading } from '../types';
import { subDays, subHours } from 'date-fns';

// Helper to generate 90 days of history for better averages
const generateHistory = (capacity: number): Reading[] => {
  const history: Reading[] = [];
  let current = capacity * 0.78; // Start at 78%
  const now = new Date();

  // Generate hourly readings for the last 90 days
  // To keep payload light for mock, we'll do 4 readings per day
  for (let i = 90 * 4; i >= 0; i--) {
    const date = subHours(now, i * 6); // Every 6 hours
    
    // Simulate consumption (randomized but consistent)
    // Avg consumption approx 100-300L per day
    const consumption = (Math.random() * 50) + 10; 
    
    // Simulate refill logic
    if (current < capacity * 0.15) {
      current = capacity * 0.98; // Refill to near full
    } else {
      current -= consumption;
    }

    history.push({
      timestamp: date.toISOString(),
      level: Math.max(0, current),
      temperature: 22 + (Math.sin(i) * 5) // Simulate temp fluctuation
    });
  }
  return history;
};

export const INITIAL_TANK: Tank = {
  id: 'UNI-01',
  name: 'Gerador Principal - Bloco A',
  location: 'Unidade Fabril São Paulo',
  capacity: 20000,
  currentLevel: 14500,
  currentHeight: 1250,
  dimensions: { radius: 950, length: 7000 },
  minThreshold: 3000,
  enableRefillAlerts: true,
  lastRefill: '2023-11-10',
  status: TankStatus.NORMAL,
  notificationEmails: [], // Initialize as empty array
  enableEmailAlerts: false,
  history: generateHistory(20000)
};

export const simulateLiveUpdate = (tank: Tank): Tank => {
  // 0.5% chance of refill event during live simulation
  if (Math.random() < 0.005) {
    return {
      ...tank,
      currentLevel: Math.min(tank.capacity, tank.currentLevel + 5000),
      status: TankStatus.REFILLING,
      lastRefill: new Date().toISOString().split('T')[0]
    };
  }

  // Live consumption fluctuation
  const consumption = Math.random() * 0.5; 
  let newLevel = Math.max(0, tank.currentLevel - consumption);
  
  let status = TankStatus.NORMAL;
  if (newLevel < tank.minThreshold) status = TankStatus.LOW;
  if (newLevel < tank.minThreshold * 0.5) status = TankStatus.CRITICAL;

  // Add new reading to history live
  const newHistory = [...tank.history];
  if (Math.random() > 0.8) { // Only add history point occasionally to prevent array explosion in demo
     newHistory.push({
         timestamp: new Date().toISOString(),
         level: newLevel,
         temperature: 24 + Math.random()
     });
  }

  return {
    ...tank,
    currentLevel: newLevel,
    status,
    history: newHistory
  };
};