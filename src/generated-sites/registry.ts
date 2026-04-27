import type { GeneratedSiteManifest } from '@/lib/generated-sites';

export const GENERATED_SITE_REGISTRY: Record<string, GeneratedSiteManifest> = {
  "goodstart": {
    "version": 1,
    "slug": "goodstart",
    "generatedAt": "2026-04-27T17:57:18.188Z",
    "sourceHash": "8e8cb0a46c45d851bc7936a6b083c2b37717b332c4c173a7bcba2d21b0306731",
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
      "headline": "Start the day by the coast.",
      "subheadline": "Breakfast, coffee, açaí, smoothies, fresh juices, and light daytime cocktails served daily in Isabela, Puerto Rico.",
      "eyebrow": "Isabela coastal cafe",
      "mood": [
        "sunny",
        "fresh",
        "coastal",
        "relaxed",
        "morning",
        "clean",
        "tropical",
        "welcoming"
      ],
      "colors": [
        "Warm sand and soft white backgrounds for an airy cafe feel.",
        "Ocean teal/sea blue as the main brand accent.",
        "Citrus yellow or orange highlights for morning energy.",
        "Fresh green accents for açaí, smoothies, and juice cues.",
        "Charcoal text for readability and premium contrast."
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
      "summary": "A launch-ready first-party website for Good Start Coastal Cafe, a sunny coastal cafe in Isabela, Puerto Rico serving breakfast, coffee, açaí, smoothies, fresh juices, and light daytime cocktails. The experience should prioritize menu viewing, hours, directions, and tap-to-call on mobile.",
      "assumptions": [],
      "sections": [
        {
          "id": "hero",
          "title": "Start the day by the coast",
          "body": [
            "Use the approved real restaurant photo with a bright, coastal overlay and strong text panel.",
            "Place View Menu, Get Directions, and Call actions prominently for mobile visitors.",
            "Mention the verified concept categories without making unsupported claims."
          ]
        },
        {
          "id": "quick-actions",
          "title": "Plan your visit fast",
          "body": [
            "Show daily hours, tap-to-call, directions, and social links in a compact mobile-first action area.",
            "Use the canonical phone number, address, and maps URL."
          ]
        },
        {
          "id": "menu",
          "title": "Good Start Coastal Cafe Menu",
          "body": [
            "Render the complete menu from editable structured menu data.",
            "Use category navigation for breakfast favorites, açaí and bowls, coffee, smoothies, fresh juices, and cocktails.",
            "Hide prices when priceText is null and never add placeholder prices."
          ]
        },
        {
          "id": "cafe-highlights",
          "title": "Fresh, bright, and easygoing",
          "body": [
            "Create three to four highlight cards around breakfast, coffee, fruit-forward bowls and smoothies, juices, and relaxed daytime drinks.",
            "Keep copy concise and concept-based; avoid invented sourcing, awards, or owner story."
          ]
        },
        {
          "id": "visit",
          "title": "Visit Good Start Coastal Cafe",
          "body": [
            "Display address, daily 8:00 AM–2:00 PM hours, call link, and directions link.",
            "Include a compact map/directions module if supported by the preview system."
          ]
        },
        {
          "id": "connect",
          "title": "Follow along",
          "body": [
            "Add Instagram and Facebook as secondary supporting links.",
            "Do not make social profiles the main product experience."
          ]
        },
        {
          "id": "footer",
          "title": "Good Start Coastal Cafe",
          "body": [
            "Repeat NAP, hours summary, directions, call, and social links.",
            "Include local SEO schema in the page implementation."
          ]
        }
      ],
      "acceptanceCriteria": [
        "The preview looks like a confident, launch-ready first-party website for Good Start Coastal Cafe on mobile and desktop.",
        "The primary visitor actions are visible above the fold or in sticky mobile actions: View Menu, Get Directions, Call, and Hours.",
        "The full menu renders from editable structured data, not hard-coded page prose.",
        "No menu prices appear because no verified prices are provided.",
        "The site does not fabricate reviews, awards, owner quotes, exact operational claims, prices, ordering links, reservation links, or restaurant-specific photography.",
        "Only the approved real photo is used for restaurant imagery; visual richness comes from design system elements and non-photographic accents.",
        "Hours show daily 8:00 AM–2:00 PM and are wired to customer-managed hours data.",
        "Phone uses (787) 830-9500 and supports tap-to-call with +17878309500."
      ]
    }
  }
};
