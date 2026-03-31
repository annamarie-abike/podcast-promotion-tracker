import { useState } from "react";
import { FileText, Loader2, Sparkles, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { EditableCard } from "./EditableCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface ExtractedData {
  vision: string;
  strategy: string;
  goals: string;
  direction: string;
  impact: string;
}

export function AboutPodcast() {
  const [documentText, setDocumentText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [originalDocument, setOriginalDocument] = useState("");
  const [editingField, setEditingField] = useState<keyof ExtractedData | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleProcess = async () => {
    if (!documentText.trim()) return;

    setIsProcessing(true);
    setOriginalDocument(documentText);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock extracted data
    const mockData: ExtractedData = {
      vision: "To create a trusted voice in the podcast space that educates and inspires listeners to take action.",
      strategy: "Weekly episodes featuring expert interviews, actionable insights, and community-driven content that builds authority and engagement.",
      goals: "Grow to 10K subscribers in 12 months, establish partnerships with 5 industry leaders, and create a sustainable revenue stream through sponsorships.",
      direction: "Moving from educational content to more interactive formats including live Q&A sessions, community challenges, and collaborative episodes.",
      impact: "Building a supportive community where listeners feel empowered to pursue their goals, share their wins, and learn from each other's experiences."
    };

    setExtractedData(mockData);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setDocumentText("");
    setExtractedData(null);
    setOriginalDocument("");
  };

  const handleStartEdit = (field: keyof ExtractedData) => {
    setEditingField(field);
    setEditValue(extractedData![field]);
  };

  const handleSaveEdit = () => {
    if (editingField && extractedData) {
      setExtractedData({
        ...extractedData,
        [editingField]: editValue
      });
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">About the Podcast</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload or paste your podcast documentation to automatically extract key insights
        </p>
      </div>

      {!extractedData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Document Input
            </CardTitle>
            <CardDescription>
              Paste your podcast strategy document, vision statement, or any comprehensive documentation about your show
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your podcast documentation here... Include information about your vision, strategy, goals, direction, and community impact."
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleProcess}
                disabled={!documentText.trim() || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Extract Insights
                  </>
                )}
              </Button>
              
              {documentText && !isProcessing && (
                <Button variant="outline" onClick={() => setDocumentText("")}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Sparkles className="size-5" />
                AI-Extracted Insights
              </CardTitle>
              <CardDescription className="text-blue-700">
                Key elements extracted from your documentation—click Edit to refine
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <EditableCard
              title="Vision & Purpose"
              value={extractedData.vision}
              isEditing={editingField === "vision"}
              editValue={editValue}
              onStartEdit={() => handleStartEdit("vision")}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditValueChange={setEditValue}
            />

            <EditableCard
              title="Strategy"
              value={extractedData.strategy}
              isEditing={editingField === "strategy"}
              editValue={editValue}
              onStartEdit={() => handleStartEdit("strategy")}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditValueChange={setEditValue}
            />

            <EditableCard
              title="Business Goals"
              value={extractedData.goals}
              isEditing={editingField === "goals"}
              editValue={editValue}
              onStartEdit={() => handleStartEdit("goals")}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditValueChange={setEditValue}
            />

            <EditableCard
              title="Direction"
              value={extractedData.direction}
              isEditing={editingField === "direction"}
              editValue={editValue}
              onStartEdit={() => handleStartEdit("direction")}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditValueChange={setEditValue}
            />

            <EditableCard
              title="Community Impact"
              value={extractedData.impact}
              isEditing={editingField === "impact"}
              editValue={editValue}
              onStartEdit={() => handleStartEdit("impact")}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onEditValueChange={setEditValue}
              className="md:col-span-2"
            />
          </div>

          <div className="flex gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  View Original Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Original Document</DialogTitle>
                  <DialogDescription>
                    The source documentation used for AI extraction
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[60vh] p-4 bg-gray-50 rounded-md">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {originalDocument}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleReset}>
              Upload New Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}