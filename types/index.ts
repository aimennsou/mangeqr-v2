export type Restaurant = {
    id: string;
    userId: string;
    name: string;
    address: string;
    phone: string;
    coverPhoto?: string;
    qrUrl?: string;
    wifi?: string;
    subdomain?: string;
    currency: Currency;
    website?: string;
    instagram?: string;
    tiktok?: string;
    google?: string;
    wifistate: Settings;
    websitestate: Settings;
    instagramstate: Settings;
    tiktokstate: Settings;
    googlestate: Settings;
    menus: Menu[];
    campaigns: MarketingCampaign[];
    reviews: Review[];
    scans: ScanData[];
    categoryData: CategoryData[];
    dishData: DishData[];
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type Menu = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    name: string;
    position: number;
    availability: string[];
    state: MenuState;
    categories: MenuCategory[];
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type MenuCategory = {
    id: string;
    menuId: string;
    menu: Menu;
    state: CatState;
    position: number;
    name: string;
    logo?: string;
    dishes: Dish[];
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type Dish = {
    id: string;
    categoryId: string;
    category: MenuCategory;
    state: DishState;
    position: number;
    name: string;
    description?: string;
    photo?: string;
    price: number;
    allergenes: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type Review = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    clientNumero?: string;
    clientEmail?: string;
    review: number;
    message?: string;
    state: ReviewState;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type MarketingCampaign = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    name: string;
    description?: string;
    subject: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    sent: boolean;
    sentAt?: Date;
    emailRecipients: EmailRecipient[];
  };
  
  export type EmailRecipient = {
    id: string;
    campaignId: string;
    campaign: MarketingCampaign;
    email: string;
    createdAt: Date;
  };
  
  export type ScanData = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    createdAt: Date;
  };
  
  export type CategoryData = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    categoryId: string;
    createdAt: Date;
  };
  
  export type DishData = {
    id: string;
    restaurantId: string;
    restaurant: Restaurant;
    dishId: string;
    createdAt: Date;
  };
  
  export type Newsletter = {
    id: string;
    email: string;
    createdAt: Date;
  };
  
  export enum UserType {
    PRO = "PRO",
    PREMIUM = "PREMIUM",
  }
  
  export enum Currency {
    EURO = "EURO",
    DOLLAR = "DOLLAR",
    DINAR = "DINAR",
  }
  
  export enum MenuState {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }
  
  export enum CatState {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }
  
  export enum DishState {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }
  
  export enum ReviewState {
    GOOGLE = "GOOGLE",
    MANGEQR = "MANGEQR",
  }
  
  export enum Settings {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }