import { useState } from "react";
import Layout from "@/components/library/Layout";
import NewSubscriptionForm from "@/pages/subscriptions/NewSubscriptionForm";
import HomePage from "@/pages/home/HomePage";
import EditSubscriptionPage from "@/pages/subscriptions/EditSubscriptionPage";
import RenewSubscriptionPage from "@/pages/subscriptions/RenewSubscriptionPage";
import LoanPage from "@/pages/borrow/LoanPage";
import ReturnLoanPage from "@/pages/borrow/ReturnLoanPage";
import LateReturnPage from "@/pages/borrow/LateReturnPage";
import GeneralReportsPage from "@/pages/reports/GeneralReportsPage";
import PersonalReportPage from "@/pages/reports/PersonalReportPage";
import OnlineRequestsPage from "@/pages/online-orders/OnlineRequestsPage";
import AlertsPage from "@/pages/notifications/AlertsPage";

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <HomePage onNavigate={setActiveSection} />;
      case "new-subscription":
        return (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-black text-foreground mb-1">اشتراك جديد</h1>
              <p className="text-muted-foreground">أنشئ اشتراكًا جديدًا للقراء بسرعة وسهولة.</p>
            </div>
            <NewSubscriptionForm />
          </div>
        );
      case "edit-subscription":
        return <EditSubscriptionPage />;
      case "renew-subscription":
        return <RenewSubscriptionPage />;
      case "lend":
        return <LoanPage />;
      case "return":
        return <ReturnLoanPage />;
      case "late-return":
        return <LateReturnPage />;
      case "general-reports":
        return <GeneralReportsPage />;
      case "personal-report":
        return <PersonalReportPage />;
      case "online-requests":
        return <OnlineRequestsPage />;
      case "alerts":
        return <AlertsPage />;
      default:
        return <HomePage onNavigate={setActiveSection} />;
    }
  };

  return (
    <Layout activeSection={activeSection} onNavigate={setActiveSection}>
      {renderContent()}
    </Layout>
  );
}
