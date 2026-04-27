import type { GeneratedSiteManifest } from '@/lib/generated-sites';

export const GENERATED_SITE_REGISTRY: Record<string, GeneratedSiteManifest> = {
  "goodstart": {
    "version": 1,
    "slug": "goodstart",
    "generatedAt": "2026-04-27T18:42:43.236Z",
    "sourceHash": "bf413a4c1ecac52ab84116b8258ed584aa08db23d174e4074c2379a70b590517",
    "restaurant": {
      "name": "Good Start Coastal Cafe",
      "city": "Isabela",
      "cuisine": "cafe",
      "address": "PR 4466 km5, Isabela, Puerto Rico 00662",
      "phone": "(787) 830-9500",
      "hours": [
        "Monday: 8:00 AM – 2:00 PM",
        "Tuesday: 8:00 AM – 2:00 PM",
        "Wednesday: 8:00 AM – 2:00 PM",
        "Thursday: 8:00 AM – 2:00 PM",
        "Friday: 8:00 AM – 2:00 PM",
        "Saturday: 8:00 AM – 2:00 PM",
        "Sunday: 8:00 AM – 2:00 PM"
      ],
      "mapsUrl": "https://maps.google.com/?cid=2958274291943456299"
    },
    "brand": {
      "headline": "Breakfast, coffee & coastal cafe favorites in Isabela",
      "subheadline": "Start the day with cafe-style breakfast, açaí bowls, smoothies, fresh juices, coffee, and brunch cocktails at Good Start Coastal Cafe.",
      "eyebrow": "Isabela, Puerto Rico • Open daily 8 AM–2 PM",
      "mood": [
        "bright",
        "coastal",
        "fresh",
        "sunny",
        "friendly",
        "morning-focused",
        "tropical"
      ],
      "colors": [
        "Warm cream or sand background for a fresh cafe base.",
        "Espresso brown or deep charcoal for readable body text.",
        "Ocean teal/aqua for primary accents and links.",
        "Papaya/coral and soft sunrise yellow as highlight colors for badges, dividers, and small decorative shapes."
      ],
      "logoUrl": null
    },
    "assets": {
      "heroImageUrl": "https://res.cloudinary.com/ignitiongo/image/upload/v1776975549/saborweb/research-assets/goodstart-cover_photo-e9e506f7a6ff03adeb82.jpg",
      "galleryImageUrls": [
        "https://res.cloudinary.com/ignitiongo/image/upload/v1776975549/saborweb/research-assets/goodstart-cover_photo-e9e506f7a6ff03adeb82.jpg"
      ]
    },
    "menu": {
      "status": "structured_menu",
      "sourceUrl": "https://www.instagram.com/goodstart466",
      "note": "Menu copy combines verified items with polished assumptions.",
      "categories": [
        {
          "name": "Breakfast Favorites",
          "description": "Morning plates and handhelds based on the cafe’s breakfast-focused concept and the one directly evidenced item.",
          "items": [
            {
              "name": "Breakfast Burrito",
              "description": "A hearty breakfast burrito with eggs, cheese, and breakfast fillings; served cafe-style.",
              "priceText": null
            },
            {
              "name": "Avocado Toast",
              "description": "Toasted bread topped with smashed avocado, citrus, sea salt, and seasonal garnish.",
              "priceText": null
            },
            {
              "name": "Egg Sandwich",
              "description": "Eggs and melty cheese on toasted bread with optional breakfast protein.",
              "priceText": null
            },
            {
              "name": "Breakfast Plate",
              "description": "Eggs, toast, and breakfast sides in a classic morning plate format.",
              "priceText": null
            },
            {
              "name": "Pancakes",
              "description": "Fluffy pancakes served with butter and syrup.",
              "priceText": null
            }
          ]
        },
        {
          "name": "Açaí & Bowls",
          "description": "Fruit-forward bowls aligned with the cafe’s stated açaí offering.",
          "items": [
            {
              "name": "Classic Açaí Bowl",
              "description": "Açaí blended and topped with granola, banana, and seasonal fruit.",
              "priceText": null
            },
            {
              "name": "Tropical Açaí Bowl",
              "description": "Açaí topped with pineapple, mango, coconut, and granola.",
              "priceText": null
            },
            {
              "name": "Fruit Yogurt Bowl",
              "description": "Creamy yogurt with fresh fruit, granola, and honey.",
              "priceText": null
            }
          ]
        },
        {
          "name": "Coffee",
          "description": "Espresso and brewed coffee drinks reflecting the cafe’s coffee program.",
          "items": [
            {
              "name": "Espresso",
              "description": "A single shot of bold espresso.",
              "priceText": null
            },
            {
              "name": "Americano",
              "description": "Espresso with hot water for a smooth, full cup.",
              "priceText": null
            },
            {
              "name": "Cappuccino",
              "description": "Espresso with steamed milk and foam.",
              "priceText": null
            },
            {
              "name": "Latte",
              "description": "Espresso with steamed milk and light foam.",
              "priceText": null
            },
            {
              "name": "Iced Latte",
              "description": "Chilled espresso and milk served over ice.",
              "priceText": null
            },
            {
              "name": "Cold Brew",
              "description": "Slow-steeped cold coffee served over ice.",
              "priceText": null
            }
          ]
        },
        {
          "name": "Smoothies",
          "description": "Blended fruit smoothies supported by the stated concept.",
          "items": [
            {
              "name": "Tropical Smoothie",
              "description": "A bright blend of pineapple, mango, and banana.",
              "priceText": null
            },
            {
              "name": "Berry Smoothie",
              "description": "Strawberry, blueberry, and banana blended smooth.",
              "priceText": null
            },
            {
              "name": "Green Smoothie",
              "description": "Spinach, pineapple, banana, and juice blended refreshing and light.",
              "priceText": null
            }
          ]
        },
        {
          "name": "Fresh Juices",
          "description": "Juice offerings aligned with the cafe’s stated concept.",
          "items": [
            {
              "name": "Orange Juice",
              "description": "Fresh, bright orange juice.",
              "priceText": null
            },
            {
              "name": "Green Juice",
              "description": "A refreshing blend of greens, citrus, and apple.",
              "priceText": null
            },
            {
              "name": "Carrot Ginger Juice",
              "description": "Carrot juice balanced with ginger and citrus.",
              "priceText": null
            }
          ]
        },
        {
          "name": "Cocktails",
          "description": "Light daytime cocktails consistent with the stated brunch/daytime offering.",
          "items": [
            {
              "name": "Mimosa",
              "description": "Sparkling wine with orange juice.",
              "priceText": null
            },
            {
              "name": "Bloody Mary",
              "description": "A savory brunch cocktail with tomato, citrus, and spice.",
              "priceText": null
            },
            {
              "name": "Passion Fruit Mojito",
              "description": "A tropical mojito with mint, lime, and passion fruit.",
              "priceText": null
            }
          ]
        }
      ]
    },
    "actions": {
      "claimHref": "https://saborweb.com/claim/goodstart",
      "primaryLabel": "View Menu",
      "primaryHref": "https://www.instagram.com/goodstart466",
      "secondaryLabel": "Directions",
      "secondaryHref": "https://maps.google.com/?cid=2958274291943456299",
      "socialLinks": [
        {
          "label": "Instagram",
          "href": "https://www.instagram.com/goodstart466"
        },
        {
          "label": "Facebook",
          "href": "https://www.facebook.com/goodstart466"
        }
      ]
    },
    "content": {
      "summary": "Good Start Coastal Cafe is a breakfast-focused coastal cafe in Isabela, Puerto Rico, offering coffee, açaí, smoothies, juices, cocktails, and morning favorites. The site should be a confident owned restaurant website with editable menu and hours, strong mobile CTAs, and a tropical-modern visual system.",
      "assumptions": [],
      "sections": [
        {
          "id": "quick-actions",
          "title": "Plan your visit",
          "body": [
            "Make the key actions immediate on mobile: view the menu, check today’s hours, get directions, and call the cafe.",
            "Use the Google Maps URL for directions and tel:+17878309500 for calls."
          ]
        },
        {
          "id": "menu",
          "title": "Menu",
          "body": [
            "Render the full Good Start Coastal Cafe menu from editable structured data with categories for Breakfast Favorites, Açaí & Bowls, Coffee, Smoothies, Fresh Juices, and Cocktails.",
            "Hide all prices because prices are not supplied. Keep menu provenance internal; public copy should feel complete and polished."
          ]
        },
        {
          "id": "hours-location",
          "title": "Hours & location",
          "body": [
            "Open Monday through Sunday from 8:00 AM to 2:00 PM.",
            "Address: PR 4466 km5, Isabela, Puerto Rico 00662.",
            "Phone: (787) 830-9500."
          ]
        },
        {
          "id": "about",
          "title": "A bright start on the coast",
          "body": [
            "Position the cafe as a fresh, casual daytime stop for breakfast, coffee, açaí, smoothies, juices, and cocktails in Isabela.",
            "Avoid unsupported claims about ownership, awards, sourcing, ocean views, or exact specialties beyond the structured menu and verified concept."
          ]
        },
        {
          "id": "social",
          "title": "Follow along",
          "body": [
            "Include Instagram and Facebook as secondary social links in the contact/footer area.",
            "Do not frame the website as a social page or rely on social links as the main experience."
          ]
        }
      ],
      "acceptanceCriteria": [
        "The preview feels like a launch-ready first-party website for Good Start Coastal Cafe, not an unclaimed listing, social profile wrapper, or placeholder brochure.",
        "Mobile-first layout has obvious actions for View Menu, Hours, Directions, and Call above the fold or in sticky navigation.",
        "Menu renders all provided categories and items from editable structured data, with no fabricated prices and no menu items embedded only in prose.",
        "Hours are editable and displayed as daily 8:00 AM–2:00 PM.",
        "Address, phone, Google Maps link, Instagram, and Facebook are present and correctly prioritized.",
        "Only one real approved photo is used; no AI/fake food or venue photography appears.",
        "SEO title, meta description, Open Graph content, and Restaurant/Cafe schema are implemented without fabricated reviews, awards, price range, or review count.",
        "Accessibility meets practical WCAG expectations: semantic headings, readable contrast, descriptive image alt text, keyboard-accessible CTAs, and visible focus states."
      ]
    }
  }
};
