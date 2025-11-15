// components/profile/ProfileTabs.jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AboutSection } from "./AboutSection";
import { TeachingHistory } from "./TeachingHistory";
import { LearningProgress } from "./LearningProgress";
import { Certifications } from "./Certifications";
import { Reviews } from "./Reviews";

export function ProfileTabs({ user, isEditable }) {
  const isTeacher = user.role === 'teacher';

  return (
    <Tabs defaultValue="about" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
          value="about"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
        >
          About
        </TabsTrigger>
        {/* {isTeacher ? (
          <>
            <TabsTrigger
              value="teaching"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Teaching
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Reviews
            </TabsTrigger>
          </>
        ) : (
          <>
            <TabsTrigger
              value="progress"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Learning Progress
            </TabsTrigger>
            <TabsTrigger
              value="certifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Certifications
            </TabsTrigger>
          </>
        )} */}
      </TabsList>
      <div className="mt-6">
        <TabsContent value="about">
          <AboutSection user={user} isEditable={isEditable} />
        </TabsContent>
        {isTeacher ? (
          <>
            <TabsContent value="teaching">
              <TeachingHistory user={user} />
            </TabsContent>
            <TabsContent value="reviews">
              <Reviews user={user} />
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="progress">
              <LearningProgress user={user} />
            </TabsContent>
            <TabsContent value="certifications">
              <Certifications user={user} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
}