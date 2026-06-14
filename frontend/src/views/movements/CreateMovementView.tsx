import { useForm, FormProvider } from "react-hook-form"
import MovementForm from "@/components/movements/MovementForm"
import { movementFormSchema, type MovementFormInputs, type MovementType } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateMovement } from "@/hooks/useMovements"

export default function CreateMovementView() {
    //1 Inicializamos la central de React Hook Form
    const methods = useForm<MovementFormInputs>({
        resolver: zodResolver(movementFormSchema), // Conectamos el esquema de Zod para validación
        defaultValues: {
            type: "" as MovementType, // Valor inicial vacío para forzar selección
            date: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
            amount: 0,
            description: ""
        }
    })

    const createMovementMutation = useCreateMovement()
    
    const onSubmit = (data: MovementFormInputs) => {
    try {
        // 🧼 Pasamos los datos por la aduana de transformación de Zod.
        // Esto convierte los "" a 'undefined' y te devuelve un 'CreateMovementDto' real.
        const cleanData = movementFormSchema.parse(data)
        console.log("🚀 Datos limpios listos para Axios:", cleanData)
        //Ahora la mutación recibe exactamente el DTO que estaba esperando
        createMovementMutation.mutate(cleanData)
    } catch (error) {
        console.error("Error en la transformación de datos", error)
    }
}
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-obsidian mb-6">Crear Nuevo Movimiento</h1>

            {/* 3. Envolvemos con el FormProvider y esparcimos los métodos con {...methods} */}
            <FormProvider {...methods}>
                <form 
                    noValidate
                    onSubmit={methods.handleSubmit(onSubmit)} // 4. Usamos handleSubmit para manejar el submit
                    className="space-y-6 bg-white p-6 rounded-lg border border-stone-200"
                >
                    
                    <MovementForm /> {/* El hijo no recibe NINGUNA prop, está en el mismo canal de radio */}

                    <button 
                        type="submit" 
                        className="w-full border bg-sage text-black py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors"
                        disabled={createMovementMutation.isPending}
                        >
                        {createMovementMutation.isPending ? "Creando..." : "Crear Movimiento"}
                    </button>
                    {/* Debug: Muestra los errores actuales */}
                    {Object.keys(methods.formState.errors).length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            <p className="font-semibold mb-2">Errores en el formulario:</p>
                            <ul className="list-disc list-inside">
                                {Object.entries(methods.formState.errors).map(([field, error]) => (
                                    <li key={field}>{field}: {error?.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </form>
            </FormProvider>
        </div>
    )
}