const BITSET_LIMB_WIDENESS = 64;
const N_WEEKLY_SCHOOL_DAYS = 7;
const N_DAILY_TIME_SLOTS = 24;

const INSTRUCTOR_TIME_SLOT_MAP_LIMBS = 3;

class InstructorTimeSlotBitMap {
    constructor(initialBitset = null) {
        if (initialBitset) {
            if (!Array.isArray(initialBitset) || initialBitset.length !== INSTRUCTOR_TIME_SLOT_MAP_LIMBS) {
                throw new Error(`Invalid initial bitset length. Expected ${INSTRUCTOR_TIME_SLOT_MAP_LIMBS}, got ${initialBitset.length}`);
            }
            this.bitset = initialBitset.map(numStr => BigInt(numStr));
        } else {
            this.bitset = Array(INSTRUCTOR_TIME_SLOT_MAP_LIMBS).fill(0n);
        }
    }

    setAvailability(available, day, timeSlot) {
        if (day < 0 || day >= N_WEEKLY_SCHOOL_DAYS) {
            throw new Error(`Invalid day: ${day}. Accepted values: 0 to ${N_WEEKLY_SCHOOL_DAYS - 1}`);
        }
        if (timeSlot < 0 || timeSlot >= N_DAILY_TIME_SLOTS) {
            throw new Error(`Invalid time slot: ${timeSlot}. Accepted values: 0 to ${N_DAILY_TIME_SLOTS - 1}`);
        }

        const idx2DTo1D = (day * N_DAILY_TIME_SLOTS) + timeSlot;
        const limbIdx = Math.floor(idx2DTo1D / BITSET_LIMB_WIDENESS);
        const limbBitIdx = idx2DTo1D % BITSET_LIMB_WIDENESS;

        if (available) {
            this.bitset[limbIdx] &= ~(1n << BigInt(limbBitIdx)) & 0xFFFFFFFFFFFFFFFFn;
        } else {
            this.bitset[limbIdx] |= (1n << BigInt(limbBitIdx));
        }
    }

    getAvailability(day, timeSlot) {
        if (day < 0 || day >= N_WEEKLY_SCHOOL_DAYS) {
            throw new Error(`Invalid day: ${day}. Accepted values: 0 to ${N_WEEKLY_SCHOOL_DAYS - 1}`);
        }
        if (timeSlot < 0 || timeSlot >= N_DAILY_TIME_SLOTS) {
            throw new Error(`Invalid time slot: ${timeSlot}. Accepted values: 0 to ${N_DAILY_TIME_SLOTS - 1}`);
        }

        const idx2DTo1D = (day * N_DAILY_TIME_SLOTS) + timeSlot;
        const limbIdx = Math.floor(idx2DTo1D / BITSET_LIMB_WIDENESS);
        const limbBitIdx = idx2DTo1D % BITSET_LIMB_WIDENESS;

        return ((this.bitset[limbIdx] >> BigInt(limbBitIdx)) & 1n) === 0n;
    }
}

// Example usage:
// const initialBitset = ["0", "1", "2"]; // Example initial values as strings
// const instructorAvailability = new InstructorTimeSlotBitMap(initialBitset);
// instructorAvailability.setAvailability(true, 2, 10);
// console.log(instructorAvailability.getAvailability(2, 10)); // true

export {
    InstructorTimeSlotBitMap,
};
