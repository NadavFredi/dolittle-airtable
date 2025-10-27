import React from 'react'
import Navbar from '@/components/Navbar'
import { AppFooter } from '@/components/AppFooter'
import ArrivalSystem from '@/components/ArrivalSystem'

interface Registration {
    id: string
    childName: string
    cycle: string
    parentPhone: string
    parentName: string
    course: string
    school: string
    class: string
    needsPickup: boolean
    trialDate: string
    inWhatsAppGroup: boolean
    registrationStatus: string
}

interface ArrivalSystemPageProps {
    registrations: Registration[]
    loading: boolean
}

export default function ArrivalSystemPage({ registrations, loading }: ArrivalSystemPageProps) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar
                totalCount={registrations.length}
                showMessagingButton={false}
            />
            <div className="flex-1">
                <ArrivalSystem registrations={registrations} loading={loading} />
            </div>
            <AppFooter />
        </div>
    )
}

