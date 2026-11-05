import { Banknote, Landmark, type LucideIcon } from "lucide-react"
import { formatCurrency } from "@/helpers/formatCurrency"
import type { AccountBalance, AccountBalanceList } from "@/types"

interface AccountBalancesProps {
    accounts: AccountBalanceList
}

const KIND_META: Record<AccountBalance["kind"], { label: string; icon: LucideIcon }> = {
    CASH: { label: "Efectivo", icon: Banknote },
    BANK: { label: "Banco", icon: Landmark },
}

export default function AccountBalances({ accounts }: AccountBalancesProps) {
    const sorted = [...accounts].sort((a, b) => a.name.localeCompare(b.name, "es"))
    const countLabel = sorted.length === 1 ? "cuenta" : "cuentas"

    return (
        <section className="rounded-lg border border-linen-light bg-white p-5 shadow-md">
            <header className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-obsidian">Cuentas</h3>
                <span className="text-xs text-clay-gray">
                    {sorted.length} {countLabel}
                </span>
            </header>

            {sorted.length === 0 ? (
                <p className="py-4 text-sm text-clay-gray">No hay cuentas registradas.</p>
            ) : (
                <ul className="divide-y divide-linen-light">
                    {sorted.map((account) => {
                        const { label, icon: Icon } = KIND_META[account.kind]
                        return (
                            <li key={account.id} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-opaque text-green-balance">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium capitalize text-obsidian">
                                            {account.name}
                                        </p>
                                        <p className="text-xs text-clay-gray">{label}</p>
                                    </div>
                                </div>
                                <span
                                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                                        account.balance < 0 ? "text-ritual-red" : "text-obsidian"
                                    }`}
                                >
                                    {formatCurrency(account.balance)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
