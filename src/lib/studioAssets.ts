import heroMenswearImg from '../assets/images/hero_luxury_menswear_1794715745265.jpg';
import blackShirtImg from '../assets/images/product_black_shirt_1794715745240.jpg';
import whiteShirtImg from '../assets/images/product_white_shirt_1794715746106.jpg';
import blackTrouserImg from '../assets/images/product_black_trouser_1794715745942.jpg';
import blueJeansImg from '../assets/images/product_blue_jeans_1794715746269.jpg';
import poloTshirtImg from '../assets/images/product_polo_tshirt_1794715746993.jpg';
import hoodieJacketImg from '../assets/images/product_hoodie_jacket_1794715747150.jpg';
import traditionalKurtaImg from '../assets/images/product_traditional_kurta_1794715747570.jpg';

export const STUDIO_IMAGES = {
  heroMenswear: heroMenswearImg,
  blackShirt: blackShirtImg,
  whiteShirt: whiteShirtImg,
  blackTrouser: blackTrouserImg,
  blueJeans: blueJeansImg,
  poloTshirt: poloTshirtImg,
  hoodieJacket: hoodieJacketImg,
  traditionalKurta: traditionalKurtaImg,
} as const;

export const STUDIO_PRESET_OPTIONS = [
  { label: 'Black Dress Shirt', url: blackShirtImg },
  { label: 'White Casual Shirt', url: whiteShirtImg },
  { label: 'Slim Fit Black Trouser', url: blackTrouserImg },
  { label: 'Blue Selvedge Jeans', url: blueJeansImg },
  { label: 'Gold-Tipped Polo T-Shirt', url: poloTshirtImg },
  { label: 'Obsidian Jacket & Hoodie', url: hoodieJacketImg },
  { label: 'Royal Black & Gold Kurta', url: traditionalKurtaImg },
  { label: 'Atelier Editorial Look', url: heroMenswearImg },
];

export function formatPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rs. ${safe.toLocaleString('en-PK')}`;
}
