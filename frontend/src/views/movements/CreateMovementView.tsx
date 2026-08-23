import { useForm, FormProvider } from "react-hook-form"
import MovementForm from "@/components/movements/MovementForm"
import { movementFormSchema, type MovementFormInputs, type MovementType } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateMovement } from "@/hooks/useMovements"
import PageHeader from "@/components/ui/PageHeader"
import { useNavigate } from "react-router-dom"

export default function CreateMovementView() {

    const navigate = useNavigate()

    //1 Inicializamos la central de React Hook Form
    const methods = useForm<MovementFormInputs>({
        resolver: zodResolver(movementFormSchema),
        mode: "onChange",
        defaultValues: {
            type: "" as MovementType,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            description: ""
        }
    })

    const createMovementMutation = useCreateMovement()
    const { isValid } = methods.formState
    const { isPending } = createMovementMutation

    const onSubmit = (data: MovementFormInputs) => {
        try {
            // 🧼 Pasamos los datos por la aduana de transformación de Zod.
            // Esto convierte los "" a 'undefined' y te devuelve un 'CreateMovementDto' real.
            const cleanData = movementFormSchema.parse(data)
            console.log("🚀 Datos limpios listos para Axios:", cleanData)
            //Ahora la mutación recibe exactamente el DTO que estaba esperando
            createMovementMutation.mutate(cleanData, {
                onSuccess: () => {
                    navigate('/movements')
                },
                onError: (error) => {
                    console.error('error al crear movimiento', error)
                }
            })
        } catch (error) {
            console.error("Error en la transformación de datos", error)
        }
    }
    return (
        <>
            <PageHeader
                title="Crear Movimiento"
                description="Llena el formulario para crear un Movimiento"
                backTo="/movements"
                backLabel="Volver"
            />

            <div className="max-w-3xl mx-auto p-6">

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
                            className={`w-full py-3 text-linen-light font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 border bg-gray-400 text-black cursor-pointer hover:bg-opacity-60 transition-colors ${(!isValid || isPending) ? "cursor-not-allowed opacity-50" : "bg-sage hover:bg-green-balance"}`}
                            disabled={!isValid || isPending}
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
        </>
    )
}
