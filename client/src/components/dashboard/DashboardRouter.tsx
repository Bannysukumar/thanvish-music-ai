import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TeacherRoute } from "@/components/auth/TeacherRoute";
import { ArtistRoute } from "@/components/auth/ArtistRoute";
import { DirectorRoute } from "@/components/auth/DirectorRoute";
import { DoctorRoute } from "@/components/auth/DoctorRoute";
import { AstrologerRoute } from "@/components/auth/AstrologerRoute";
import { StudentRoute } from "@/components/auth/StudentRoute";
import { DashboardLayout } from "./DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import Generator from "@/pages/Generator";
import DashboardLibrary from "@/pages/dashboard/DashboardLibrary";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import DashboardUpgrade from "@/pages/dashboard/DashboardUpgrade";
import HoroscopeProfile from "@/pages/dashboard/HoroscopeProfile";
import MusicTherapyDashboard from "@/pages/dashboard/MusicTherapyDashboard";
import MusicTeacherDashboard from "@/pages/dashboard/MusicTeacherDashboard";
import ArtistDashboard from "@/pages/dashboard/ArtistDashboard";
import MusicDirectorDashboard from "@/pages/dashboard/MusicDirectorDashboard";
import DoctorDashboard from "@/pages/dashboard/DoctorDashboard";
import AstrologerDashboard from "@/pages/dashboard/AstrologerDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import CourseBuilder from "@/pages/dashboard/teacher/CourseBuilder";
import MyLessons from "@/pages/dashboard/teacher/MyLessons";
import StudentManagement from "@/pages/dashboard/teacher/StudentManagement";
import Earnings from "@/pages/dashboard/teacher/Earnings";
import TeacherSettings from "@/pages/dashboard/teacher/TeacherSettings";
import Analytics from "@/pages/dashboard/teacher/Analytics";
import ArtistLibrary from "@/pages/dashboard/artist/ArtistLibrary";
import UploadTrack from "@/pages/dashboard/artist/UploadTrack";
import Albums from "@/pages/dashboard/artist/Albums";
import CollaborationRequests from "@/pages/dashboard/artist/CollaborationRequests";
import LicensingRequests from "@/pages/dashboard/artist/LicensingRequests";
import ArtistAnalytics from "@/pages/dashboard/artist/ArtistAnalytics";
import ArtistSettings from "@/pages/dashboard/artist/ArtistSettings";
import Projects from "@/pages/dashboard/director/Projects";
import ArtistDiscovery from "@/pages/dashboard/director/ArtistDiscovery";
import Shortlists from "@/pages/dashboard/director/Shortlists";
import DirectorRequests from "@/pages/dashboard/director/DirectorRequests";
import Approvals from "@/pages/dashboard/director/Approvals";
import DirectorSettings from "@/pages/dashboard/director/DirectorSettings";
import DirectorAnalytics from "@/pages/dashboard/director/DirectorAnalytics";
import TherapyPrograms from "@/pages/dashboard/doctor/TherapyPrograms";
import SessionTemplates from "@/pages/dashboard/doctor/SessionTemplates";
import GuidanceArticles from "@/pages/dashboard/doctor/GuidanceArticles";
import DoctorAnalytics from "@/pages/dashboard/doctor/DoctorAnalytics";
import DoctorSettings from "@/pages/dashboard/doctor/DoctorSettings";
import RasiRecommendations from "@/pages/dashboard/astrologer/RasiRecommendations";
import AstroMusicTemplates from "@/pages/dashboard/astrologer/AstroMusicTemplates";
import HoroscopeContentPosts from "@/pages/dashboard/astrologer/HoroscopeContentPosts";
import AstrologerRequests from "@/pages/dashboard/astrologer/AstrologerRequests";
import AstrologerAnalytics from "@/pages/dashboard/astrologer/AstrologerAnalytics";
import AstrologerSettings from "@/pages/dashboard/astrologer/AstrologerSettings";
import EducationalMusic from "@/pages/dashboard/student/EducationalMusic";
import InstrumentalEducation from "@/pages/dashboard/student/InstrumentalEducation";
import PracticeRoom from "@/pages/dashboard/student/PracticeRoom";
import MusicEBooks from "@/pages/dashboard/student/MusicEBooks";
import StudentSaved from "@/pages/dashboard/student/StudentSaved";
import StudentSettings from "@/pages/dashboard/student/StudentSettings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Component to check onboarding status and redirect if needed
 */
function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || user.isGuest) {
        setIsChecking(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Only redirect if onboardingCompleted is explicitly false (new signup)
          // Allow access if it's undefined (existing users) or true (completed onboarding)
          if (userData.onboardingCompleted === false) {
            setLocation("/onboarding");
            return;
          }
        } else {
          // User document doesn't exist - this shouldn't happen but redirect just in case
          setLocation("/onboarding");
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * DashboardRouter component - handles all dashboard routes
 */
export function DashboardRouter() {
  return (
    <ProtectedRoute>
      <OnboardingCheck>
        <DashboardLayout>
          <Switch>
            <Route path="/dashboard" component={DashboardHome} />
            <Route path="/dashboard/generate" component={Generator} />
            <Route path="/dashboard/library" component={DashboardLibrary} />
            <Route path="/dashboard/horoscope" component={HoroscopeProfile} />
            <Route path="/dashboard/music-therapy" component={MusicTherapyDashboard} />
            <Route path="/dashboard/profile" component={DashboardProfile} />
            <Route path="/dashboard/upgrade" component={DashboardUpgrade} />
            
            {/* Teacher routes - protected by TeacherRoute */}
            {/* More specific routes must come before general ones */}
            <Route path="/dashboard/teacher/courses/new">
              <TeacherRoute>
                <CourseBuilder />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/courses">
              <TeacherRoute>
                <CourseBuilder />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/lessons/upload">
              <TeacherRoute>
                <MyLessons />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/lessons">
              <TeacherRoute>
                <MyLessons />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/students">
              <TeacherRoute>
                <StudentManagement />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/earnings">
              <TeacherRoute>
                <Earnings />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/settings">
              <TeacherRoute>
                <TeacherSettings />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher/analytics">
              <TeacherRoute>
                <Analytics />
              </TeacherRoute>
            </Route>
            <Route path="/dashboard/teacher">
              <TeacherRoute>
                <MusicTeacherDashboard />
              </TeacherRoute>
            </Route>
            
            {/* Artist routes - protected by ArtistRoute */}
            {/* More specific routes must come before general ones */}
            <Route path="/dashboard/artist/upload">
              <ArtistRoute>
                <UploadTrack />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/albums/new">
              <ArtistRoute>
                <Albums />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/albums">
              <ArtistRoute>
                <Albums />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/requests">
              <ArtistRoute>
                <CollaborationRequests />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/licensing">
              <ArtistRoute>
                <LicensingRequests />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/analytics">
              <ArtistRoute>
                <ArtistAnalytics />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/settings">
              <ArtistRoute>
                <ArtistSettings />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist/library">
              <ArtistRoute>
                <ArtistLibrary />
              </ArtistRoute>
            </Route>
            <Route path="/dashboard/artist">
              <ArtistRoute>
                <ArtistDashboard />
              </ArtistRoute>
            </Route>
            
            {/* Director routes - protected by DirectorRoute */}
            {/* More specific routes must come before general ones */}
            <Route path="/dashboard/director/projects/new">
              <DirectorRoute>
                <Projects />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/projects/:id">
              <DirectorRoute>
                <Projects />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/projects">
              <DirectorRoute>
                <Projects />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/discovery">
              <DirectorRoute>
                <ArtistDiscovery />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/shortlists">
              <DirectorRoute>
                <Shortlists />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/requests">
              <DirectorRoute>
                <DirectorRequests />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/approvals">
              <DirectorRoute>
                <Approvals />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/settings">
              <DirectorRoute>
                <DirectorSettings />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director/analytics">
              <DirectorRoute>
                <DirectorAnalytics />
              </DirectorRoute>
            </Route>
            <Route path="/dashboard/director">
              <DirectorRoute>
                <MusicDirectorDashboard />
              </DirectorRoute>
            </Route>
            
            {/* Doctor routes - protected by DoctorRoute */}
            {/* More specific routes must come before general ones */}
            <Route path="/dashboard/doctor/programs/new">
              <DoctorRoute>
                <TherapyPrograms />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/programs/:id">
              <DoctorRoute>
                <TherapyPrograms />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/programs">
              <DoctorRoute>
                <TherapyPrograms />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/templates/new">
              <DoctorRoute>
                <SessionTemplates />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/templates/:id">
              <DoctorRoute>
                <SessionTemplates />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/templates">
              <DoctorRoute>
                <SessionTemplates />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/articles/new">
              <DoctorRoute>
                <GuidanceArticles />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/articles/:id">
              <DoctorRoute>
                <GuidanceArticles />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/articles">
              <DoctorRoute>
                <GuidanceArticles />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/analytics">
              <DoctorRoute>
                <DoctorAnalytics />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor/settings">
              <DoctorRoute>
                <DoctorSettings />
              </DoctorRoute>
            </Route>
            <Route path="/dashboard/doctor">
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            </Route>
            
            {/* Astrologer routes - protected by AstrologerRoute */}
            {/* More specific routes must come before general ones */}
            <Route path="/dashboard/astrologer/templates/new">
              <AstrologerRoute>
                <AstroMusicTemplates />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/templates/:id">
              <AstrologerRoute>
                <AstroMusicTemplates />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/templates">
              <AstrologerRoute>
                <AstroMusicTemplates />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/recommendations/new">
              <AstrologerRoute>
                <RasiRecommendations />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/recommendations/:id">
              <AstrologerRoute>
                <RasiRecommendations />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/recommendations">
              <AstrologerRoute>
                <RasiRecommendations />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/posts/new">
              <AstrologerRoute>
                <HoroscopeContentPosts />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/posts/:id">
              <AstrologerRoute>
                <HoroscopeContentPosts />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/posts">
              <AstrologerRoute>
                <HoroscopeContentPosts />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/requests">
              <AstrologerRoute>
                <AstrologerRequests />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/analytics">
              <AstrologerRoute>
                <AstrologerAnalytics />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer/settings">
              <AstrologerRoute>
                <AstrologerSettings />
              </AstrologerRoute>
            </Route>
            <Route path="/dashboard/astrologer">
              <AstrologerRoute>
                <AstrologerDashboard />
              </AstrologerRoute>
            </Route>
            
            {/* Student routes - protected by StudentRoute */}
            <Route path="/dashboard/student/educational-music">
              <StudentRoute>
                <EducationalMusic />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student/instrumental-education">
              <StudentRoute>
                <InstrumentalEducation />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student/practice">
              <StudentRoute>
                <PracticeRoom />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student/ebooks">
              <StudentRoute>
                <MusicEBooks />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student/saved">
              <StudentRoute>
                <StudentSaved />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student/settings">
              <StudentRoute>
                <StudentSettings />
              </StudentRoute>
            </Route>
            <Route path="/dashboard/student">
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            </Route>
            
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </OnboardingCheck>
    </ProtectedRoute>
  );
}

