from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, datetime

app = FastAPI(title="Hotel Booking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory store ──────────────────────────────────────────────────────────

HOTELS = [
    {
        "id": "1",
        "name": "The Bondi Grand",
        "tagline": "Beachfront Luxury Redefined",
        "location": "Campbell Parade, Bondi Beach NSW 2026",
        "description": "Perched directly on the sands of Bondi Beach, The Bondi Grand sets the standard for oceanfront luxury with award-winning dining and a clifftop infinity pool.",
        "price_from": 550,
        "theme": "ocean",
        "rooms": [
            {"id": "r1", "name": "Ocean Suite", "type": "Suite", "price_per_night": 850, "max_guests": 2, "description": "Floor-to-ceiling ocean views, king bed, private balcony and marble ensuite."},
            {"id": "r2", "name": "Deluxe King", "type": "Deluxe", "price_per_night": 550, "max_guests": 2, "description": "Spacious room with partial ocean views and premium Frette linens."},
            {"id": "r3", "name": "Grand Penthouse", "type": "Penthouse", "price_per_night": 1800, "max_guests": 4, "description": "Two-level penthouse with private rooftop terrace and butler service."},
        ],
    },
    {
        "id": "2",
        "name": "Pacific Pearl Bondi",
        "tagline": "Boutique Elegance by the Sea",
        "location": "Notts Avenue, Bondi Beach NSW 2026",
        "description": "An intimate boutique retreat steps from the shore. Pacific Pearl combines curated design with bespoke guest experiences.",
        "price_from": 480,
        "theme": "emerald",
        "rooms": [
            {"id": "r4", "name": "Pearl Suite", "type": "Suite", "price_per_night": 720, "max_guests": 2, "description": "Elegant suite with private plunge pool, curated art and coastal panoramas."},
            {"id": "r5", "name": "Coastal Retreat", "type": "Deluxe", "price_per_night": 480, "max_guests": 2, "description": "Serene room with handcrafted furnishings and direct beach access."},
        ],
    },
    {
        "id": "3",
        "name": "Bondi Crest Resort",
        "tagline": "Above It All",
        "location": "Blair Street, Bondi Heights NSW 2026",
        "description": "Elevated above Bondi Bay on a dramatic headland, the Crest Resort commands sweeping panoramic views across the entire coastline.",
        "price_from": 620,
        "theme": "violet",
        "rooms": [
            {"id": "r6", "name": "Crest Villa", "type": "Villa", "price_per_night": 1200, "max_guests": 4, "description": "Private villa with infinity pool, outdoor dining and 360° bay views."},
            {"id": "r7", "name": "Skyline Suite", "type": "Suite", "price_per_night": 900, "max_guests": 2, "description": "Premium suite with wraparound terrace and dedicated sommelier service."},
            {"id": "r8", "name": "Resort King", "type": "Deluxe", "price_per_night": 620, "max_guests": 2, "description": "Spacious room with direct access to the heated infinity pool."},
        ],
    },
]

store: dict = {"users": [], "bookings": [], "_user_id": 1, "_booking_id": 1}


# ── Helpers ──────────────────────────────────────────────────────────────────

def find_room(room_id: str):
    for hotel in HOTELS:
        for room in hotel["rooms"]:
            if room["id"] == room_id:
                return hotel, room
    return None, None


def dates_overlap(ci: str, co: str, bci: str, bco: str) -> bool:
    return bci < co and bco > ci


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str


class PaymentInfo(BaseModel):
    card_name: str
    card_number: str
    card_expiry: str
    card_cvv: str


class BookingCreate(BaseModel):
    user_id: str
    room_id: str
    check_in: date
    check_out: date
    payment: PaymentInfo


# ── Routes ───────────────────────────────────────────────────────────────────

@app.post("/api/users")
def create_or_get_user(body: UserCreate):
    email = body.email.lower().strip()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    user = next((u for u in store["users"] if u["email"] == email), None)
    if not user:
        user = {"id": str(store["_user_id"]), "email": email, "created_at": datetime.utcnow().isoformat()}
        store["users"].append(user)
        store["_user_id"] += 1
    return user


@app.get("/api/hotels")
def list_hotels():
    return HOTELS


@app.get("/api/hotels/{hotel_id}")
def get_hotel(hotel_id: str):
    hotel = next((h for h in HOTELS if h["id"] == hotel_id), None)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return hotel


@app.get("/api/availability")
def get_availability(
    hotel_id: str = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
):
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    hotel = next((h for h in HOTELS if h["id"] == hotel_id), None)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    ci, co = check_in.isoformat(), check_out.isoformat()
    available = [
        r for r in hotel["rooms"]
        if not any(
            b["room_id"] == r["id"] and dates_overlap(ci, co, b["check_in"], b["check_out"])
            for b in store["bookings"]
        )
    ]
    return available


@app.post("/api/bookings", status_code=201)
def create_booking(body: BookingCreate):
    card_digits = body.payment.card_number.replace(" ", "")
    if card_digits[-4:] != "6767":
        raise HTTPException(status_code=402, detail="Payment declined. Please check your card details.")

    hotel, room = find_room(body.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if body.check_out <= body.check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")

    ci, co = body.check_in.isoformat(), body.check_out.isoformat()
    if any(b["room_id"] == body.room_id and dates_overlap(ci, co, b["check_in"], b["check_out"]) for b in store["bookings"]):
        raise HTTPException(status_code=409, detail="Room unavailable for selected dates")

    nights = (body.check_out - body.check_in).days
    booking = {
        "id": f"BND-{str(store['_booking_id']).zfill(4)}",
        "user_id": body.user_id,
        "hotel_id": hotel["id"],
        "hotel_name": hotel["name"],
        "hotel_location": hotel["location"],
        "room_id": body.room_id,
        "room_name": room["name"],
        "room_type": room["type"],
        "check_in": ci,
        "check_out": co,
        "nights": nights,
        "price_per_night": room["price_per_night"],
        "total": nights * room["price_per_night"],
        "payment": {"last4": card_digits[-4:], "card_name": body.payment.card_name},
        "created_at": datetime.utcnow().isoformat(),
    }
    store["bookings"].append(booking)
    store["_booking_id"] += 1
    return booking


@app.get("/api/bookings")
def list_bookings(user_id: str = Query(...)):
    return [b for b in store["bookings"] if b["user_id"] == user_id]


@app.get("/api/bookings/{booking_id}")
def get_booking(booking_id: str):
    booking = next((b for b in store["bookings"] if b["id"] == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@app.post("/api/reset", status_code=204)
def reset_store():
    """Wipe all in-memory state. Used by Playwright globalSetup between runs."""
    store["users"].clear()
    store["bookings"].clear()
    store["_user_id"] = 1
    store["_booking_id"] = 1
