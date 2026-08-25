import type { MovementType } from "@/types"

export const MOVEMENT_TYPES: Record<MovementType, { label: string, color: string, bg: string }> = {
    INCOME: {
        label: 'Ingreso',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'
    },
    EXPENSE: {
        label: 'Gasto',
        color: 'text-ritual-red',
        bg: 'bg-ritual-red-opaque'

    },
    DEPOSIT: {
        label: 'Depósito',
        color: 'text-rise-paper',
        bg: 'bg-gray-400'

    },
    WITHDRAWAL: {
        label: 'Retiro',
        color: 'text-obsidian',
        bg: 'bg-linen-light'

    },
    TRANSFER: {
        label: 'Transferencia',
        color: 'text-clay-gray',
        bg: 'bg-clay-gray-opaque'

    },
} as const
