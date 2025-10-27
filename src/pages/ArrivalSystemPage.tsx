import React from 'react'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
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
        <>
            <Navbar
                totalCount={registrations.length}
                showMessagingButton={false}
            />
            <ArrivalSystem registrations={registrations} loading={loading} />
            <AppFooter />
        </>
    )
}

