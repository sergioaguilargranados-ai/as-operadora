"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, CreditCard, Calendar as CalendarIcon, Shield, Plane, Wallet } from "lucide-react"

export default function MobilePaymentsPage() {
  const router = useRouter()

  const payments = [
    {
      id: "PAY-0001",
      title: "Depósito inicial",
      trip: "Viaje a Grecia y Turquía",
      amount: "$1,000.00 USD",
      status: "Pagado",
      date: "15 Ene 2024",
      icon: CreditCard
    },
    {
      id: "PAY-0002",
      title: "Pago 2 de 4",
      trip: "Viaje a Grecia y Turquía",
      amount: "$1,000.00 USD",
      status: "Pagado",
      date: "15 Feb 2024",
      icon: CalendarIcon
    },
    {
      id: "PAY-0003",
      title: "Pago 3 de 4",
      trip: "Viaje a Grecia y Turquía",
      amount: "$1,000.00 USD",
      status: "Pagado",
      date: "15 Mar 2024",
      icon: CalendarIcon
    },
    {
      id: "PAY-0004",
      title: "Pago final",
      trip: "Viaje a Grecia y Turquía",
      amount: "$1,000.00 USD",
      status: "Pagado",
      date: "15 Abr 2024",
      icon: CalendarIcon
    },
    {
      id: "INS-0001",
      title: "Seguro de viaje",
      trip: "Viaje a Grecia y Turquía",
      amount: "$200.00 USD",
      status: "Pagado",
      date: "15 Abr 2024",
      icon: Shield
    },
    {
      id: "EXC-0001",
      title: "Excursión Santorini",
      trip: "Viaje a Grecia y Turquía",
      amount: "$150.00 USD",
      status: "Pagado",
      date: "20 Abr 2024",
      icon: Plane
    }
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-[#FDFDFD] z-30">
        <button onClick={() => router.back()} className="text-black hover:text-gray-600 p-2 -ml-2">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <img
          src="/logo.png"
          alt="AS Operadora"
          className="h-10 object-contain"
          onError={(e) => (e.currentTarget.src = "/logo.png")}
        />
        <button className="text-black hover:text-gray-600 p-2 -mr-2">
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-6">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Pagos</h1>
        <p className="text-sm text-gray-500">
          Historial de pagos realizados
        </p>
      </div>

      {/* Payment List */}
      <div className="px-4 space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-start gap-4 active:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-xl border border-blue-100 bg-blue-50/50 flex items-center justify-center flex-shrink-0 text-[#003366]">
              <payment.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-900 text-sm">{payment.title}</h3>
                <span className="font-bold text-gray-900">{payment.amount}</span>
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-gray-500 truncate pr-2">{payment.trip}</p>
                <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                  {payment.status}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] text-gray-400 font-mono">ID: {payment.id}</p>
                <p className="text-[10px] text-gray-400">{payment.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white p-4 border-t border-gray-200 flex flex-col z-50">
        <button className="w-full bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg">
          <Wallet className="w-5 h-5" />
          Realiza tu próximo pago
        </button>
      </div>

    </div>
  )
}
