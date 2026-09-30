import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FileToBase64 from "./components/FileToBase64";
import Base64ToFile from "./components/Base64ToFile";
import PageWrapper from "@/components/PageWrapper";

const Homepage = () => {
  const [tab, setTab] = useState<"encode" | "decode">("encode");
  const [handoffVersion, setHandoffVersion] = useState(0);

  const handleSendToDecoder = () => {
    setHandoffVersion((v) => v + 1);
    setTab("decode");
  };

  return (
    <PageWrapper>
      <div className="component:Homepage animate-fade-in">
        <div className="mb-6 xs:mb-4">
          <h1 className="text-2xl xs:text-3xl font-bold tracking-tight">Công cụ chuyển đổi Base64</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chuyển đổi ảnh/video sang Base64 và ngược lại một cách nhanh chóng
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "encode" | "decode")} className="w-full">
          <TabsList className="mb-4 w-full xs:max-w-md">
            <TabsTrigger value="encode" className="flex-1">Ảnh / Video → Base64</TabsTrigger>
            <TabsTrigger value="decode" className="flex-1">Base64 → Ảnh / Video</TabsTrigger>
          </TabsList>

          <TabsContent value="encode" className="animate-slide-up">
            <FileToBase64 onSendToDecoder={handleSendToDecoder} />
          </TabsContent>
          <TabsContent value="decode" className="animate-slide-up">
            <Base64ToFile incomingVersion={handoffVersion} />
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
};

export default Homepage;
