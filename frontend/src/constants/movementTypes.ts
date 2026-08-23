import type { MovementType } from "@/types"

export const MOVEMENT_TYPES: Record<MovementType, { label: string, color: string, bg: string }> = {
    INCOME: {
        label: 'Ingreso',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'
    },
    EXPENSE: {
        label: 'Gasto',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'

    },
    DEPOSIT: {
        label: 'Depósito',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'

    },
    WITHDRAWAL: {
        label: 'Retiro',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'

    },
    TRANSFER: {
        label: 'Transferencia',
        color: 'text-green-balance',
        bg: 'bg-green-balance-opaque'

    },
} as const
