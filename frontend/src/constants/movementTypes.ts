import type { MovementType } from "@/types"

export const MOVEMENT_TYPES: Record<MovementType, { label: string }> = {
    INCOME: {
        label: 'Ingreso',
    },
    EXPENSE: {
        label: 'Gasto',
    },
    DEPOSIT: {
        label: 'Depósito',
    },
    WITHDRAWAL: {
        label: 'Retiro',
    },
    TRANSFER: {
        label: 'Transferencia',
    },
} as const