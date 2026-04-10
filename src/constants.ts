import { Stop, Driver, Booking } from './types';

export const STOPS: Stop[] = [
  {
    id: '1',
    name: 'Central Station',
    time: '08:15',
    description: 'Terminal 1 Connection',
    status: 'departed'
  },
  {
    id: '2',
    name: 'Heritage Park',
    time: '08:24',
    description: 'Gate B • Platform 4',
    status: 'current',
    isNow: true
  },
  {
    id: '3',
    name: 'The Grand Library',
    time: '08:32',
    description: 'Walking distance to Arts District',
    status: 'upcoming'
  },
  {
    id: '4',
    name: 'Emerald Valley',
    time: '08:45',
    description: 'North Transit Hub',
    status: 'upcoming'
  }
];

export const DRIVERS: Driver[] = [
  {
    id: '1',
    name: 'Ahmed Mansour',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNjs-I3fWgOI_Tnflt769LJL-3hTbxeotU0E-UAroyCjHRCuqCXLp1wDOwiEmR7gLTaoqPfMf9eaITcLcKb3ShISKoOeBKGItbwfoQI-Ke4PJnrfvgKujWIGptVn25JcXL6wIGvawQGIV34CX5qvP4pGEMI21ePW6RpLDsPmdebNcAJzekkw1h-zRFRZTxVXfTFL-TGaZg76EGPJaOTxVoGAndVggwwPHJOE82zMTUHxwEdwOLipr9D2xiloMKHrpc3Hbh12q5kH1v',
    vehicle: 'Toyota Hiace High Roof',
    departs: '09:45',
    price: '12.5 TND',
    availability: 3,
    maxSeats: 5,
    isPro: true
  },
  {
    id: '2',
    name: 'Hedi Ben Amor',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG1HAJWtn6xBPWZK4pDQ2Uj8R2nIvTmrHq3D6xn-E4-s6x-Q7hkYj8cUCnW3QOFbguMwUu36GkRbxhiAlseowUo94hZ10yGnXIqvnCObjJqgnbXZAdFpa9HUlU629aHvjms0iOepM79kSNiA0cIlH2EroJmRlMv2fEg2zWdnPcf-b6PKtumqNFGxn8KZvLpMhXjMR8zPQOOlDkZM6V24_8RlqNxeR8aLh5IrG1qXdADnjJf3enuB5qvZUtbl5MzK4-9SK8vg2oHAa8',
    vehicle: 'Volkswagen Transporter',
    departs: '10:15',
    price: '12.0 TND',
    availability: 1,
    maxSeats: 5,
    rating: '4.9',
    reviews: '240+'
  },
  {
    id: '3',
    name: 'Sami Trabelsi',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyg_lppd3LO2l_Lqp8ru3z02-SNAiFT1RmPpsTKyq4Me4snsc-qn6M8UdWZW1IgZJl9hGbYagIOJw7CuoTCiHqgzimijtcFGf-DgpP7C_hG2XaiS_xCHbjdOSXrrntqImyGVTBVxZmAIpLff1plY3aQHg-MbxFJYUJUgAHRpMvB20k-8sDSVx4ffGNTumVVMK1TXids0a7_IK7eTOGoMaljROEKjQLk7E7JSF4ZO2WL0mVgU54DNYcQ5SG9g5jrVKffc0rc1-Vhhuj',
    vehicle: 'Mercedes Sprinter',
    departs: '10:45',
    price: '12.5 TND',
    availability: 0,
    maxSeats: 5
  }
];

export const BOOKINGS: Booking[] = [
  {
    id: '1',
    passengerName: 'Elena Rodriguez',
    passengerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAohIxi_DFsWoWAstcLpl_wjiI0hI0Uwuv6VEeIjFcd2dAcEeN2Zh3zi6x1IyTdHKGCyYLKLsEfONKzTYx9T513PXqCSv1PVr2Rjn3PkFFw39zpBVRgmAhphtjoM9Y1f-H9wM_4Vnr4IAZImaQYNZB-WVOknBGS5obe60BSV5s7iEpNEu4-QxgBGSMPwhg5O6CKM2rrmF2xuW0qePNgpFZ9EZItCe9dpWYMmYcZMbBC159rino54ndT2GK-8rJQJp0_Nj0gpz_ah7Rn',
    seat: 'A1',
    trip: 'Airport Express',
    time: '08:00',
    status: 'confirmed'
  },
  {
    id: '2',
    passengerName: 'Marcus Chen',
    passengerAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPc95uy5JGzfYe5NXU4pdmFhUmoCeb3IdOBeDozfe9fLXbry_gcnojxqDifs9ZhhgKqimbLe6H6L07Gq3vTvyHwjpuORGkmppbdMFkZqNijsstOQRXpttJu0Uq1n9_wXDapU3yYUiaknMpj7KkfjN0VobVPQpglcDzBrGXmoy__FTbHaqcFOWRUruydRwFa8XoLd-Vse6poOcM9QtKTgJlsZO6nXf7hApw7APvNE6SrIeBBETOunPCbtjkTiTo_WAD1bi3BkDwj2AQ',
    seat: 'B2',
    trip: 'Airport Express',
    time: '08:00',
    status: 'confirmed'
  },
  {
    id: '3',
    passengerName: 'Jordan Smith',
    passengerAvatar: '',
    seat: 'C1',
    trip: 'Afternoon Trip',
    time: '17:15',
    status: 'pending'
  }
];
