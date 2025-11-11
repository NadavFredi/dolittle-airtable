import React from 'react'
import Navbar from '@/components/Navbar'
import AppFooter from '@/components/AppFooter'
import MessagingSystemContent from '@/components/MessagingSystemContent'

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
    discountType?: string
}

interface MessagingSystemProps {
    registrations: Registration[]
    filterOptions: {
        schools: string[]
        cycles: string[]
        courses: string[]
        classes: string[]
        registrationStatuses: string[]
        discountTypes: string[]
    }
    loading: boolean
    error: string | null
    handleRefresh: () => void
    refreshing: boolean
    // Add all other props needed for the messaging system
}

export default function MessagingSystem(props: MessagingSystemProps) {
    return (
        <>
            <Navbar
                totalCount={props.registrations.length}
                onRefresh={props.handleRefresh}
                refreshing={props.refreshing}
            />
            <MessagingSystemContent {...props} />
            <AppFooter />
        </>
    )
}

