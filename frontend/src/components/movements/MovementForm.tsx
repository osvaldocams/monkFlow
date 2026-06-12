// src/components/movements/MovementForm.tsx
import type { MovementFormInputs } from "@/types"
import { useFormContext } from "react-hook-form"
import { MOVEMENT_TYPES } from "@/constants/movementTypes"
import { useAccounts } from "@/hooks/useAccounts"

export default function MovementForm() {

    const { register, formState: { errors } } = useFormContext<MovementFormInputs>()

    const { data, isLoading, isError, errorMessage } = useAccounts()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Tipo de Movimiento */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">
                    Tipo de Movimiento
                </label>
                <select 
                    {...register("type")} // 👈 Conectamos con RHF
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    {Object.entries(MOVEMENT_TYPES).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* Tag (Dummy temporal) */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Tag</label>
                <select className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150">
                    <option value="">-- Seleccionar Tag --</option>
                </select>
            </div>

            {/* Date and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                <div>
                    <label className="block text-sm font-medium text-obsidian mb-2">Fecha</label>
                    <input 
                        type="date" 
                        {...register("date", { required: "La fecha es obligatoria" })} // 👈 Validación básica nativa
                        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                    />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{String(errors.date.message)}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-obsidian mb-2">Monto ($)</label>
                    <input
                        type="number" 
                        step="0.01"
                        placeholder="Ej: 50.00" 
                        {...register("amount", { 
                            valueAsNumber: true, // Convierte el valor a número automáticamente
                            required: "El monto es obligatorio",
                            min: { value: 0.01, message: "El monto debe ser mayor a cero" }
                        })} 
                        className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                    />
                    {errors.amount?.message && (<p className="text-red-500 text-xs font-semibold mt-1">{errors.amount.message}</p>)}
                </div>
            </div>

            {/* Accounts Relation */}
            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Ingreso</label>
                <select 
                    {...register("incomeAccountId")}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    {data?.map(account => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-obsidian mb-2">Cuenta Egreso</label>
                <select 
                    {...register("expenseAccountId")}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150"
                >
                    <option value="">-- Seleccionar --</option>
                    {data?.map(account => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-obsidian mb-2">Descripción</label>
                <textarea 
                    placeholder="Detalles del movimiento (Ej: Pago de renta, Venta freelance)." 
                    {...register("description", { maxLength: { value: 200, message: "Máximo 200 caracteres" } })}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:ring-sage focus:border-sage transition duration-150" 
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{String(errors.description.message)}</p>}
            </div>
        </div>
    )
}