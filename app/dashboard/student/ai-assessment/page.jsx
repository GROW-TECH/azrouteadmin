"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, Lightbulb } from "lucide-react";

export default function AIAssessmentPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <BrainCircuit className="w-6 h-6 text-blue-600" />
        AI-Based Assessment
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Personalized Skill Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Our AI analyzed your game history, practice sessions, and test scores to generate a performance summary.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-sm">Tactical Understanding</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Good – Solves common mid-game tactics accurately
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-sm">Endgame Mastery</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Needs Improvement – Struggles with pawn promotion timing
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-sm">Opening Repertoire</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Strong – Follows classical lines effectively
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-sm">Decision Speed</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Average – Takes time under pressure
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">
              <Lightbulb className="w-4 h-4 mr-2" />
              Suggest Practice Plan
            </Button>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New AI Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
