import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from "@/components/ui/card"
import usePostAndPut from "@/hooks/usePostAndPut"
import axios from "axios"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";


export default function ComposeEmail({ enabled }: { enabled: boolean }) {
  console.log(enabled)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null | undefined>(null)

  const [prompt, setPrompt] = useState("")
  const [promptFile, setPromptFile] = useState<File | null | undefined>(null)

  const mailComposeHook = usePostAndPut(axios.post)
  const aiMailHook = usePostAndPut(axios.post)

  const handleSubmit = async () => {
    if (to === "" || subject === "" || body === "") {
      return
    }

    const formData = new FormData()
    formData.append("to", to)
    formData.append("subject", subject)
    formData.append("body", body)
    file && formData.append("file", file)
    const response = await mailComposeHook.callApi("mails/compose", formData, false, true, true);
    console.log(response)
  }

  return (
    <div className="w-full  mx-auto ">

      <Card>

        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <Dialog>
            <DialogTrigger>
              <Button size="sm" variant="secondary">
                Generate with AI
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Email Generator</DialogTitle>

                <DialogDescription className="flex gap-3 flex-col items-start justify-center">

                  <p className="text-sm text-muted-foreground">
                    Describe the email you want to generate.
                    Example: "Write a professional email applying for a Full Stack
                    Developer internship at ABC company."
                  </p>

                  <Input type="file" onChange={(e) => setPromptFile(e?.target?.files?.[0])} />

                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="h-[140px]" />

                  <Button
                    disabled={aiMailHook.loading}
                    onClick={
                      async () => {
                        const formData = new FormData()
                        formData.append("prompt", prompt)
                        if (promptFile) formData.append("file", promptFile)
                        const response = await aiMailHook.callApi("mails/generate", formData, false, true, false)
                        setBody(response.data.data.body)
                        setSubject(response.data.data.subject)
                      }
                    }
                    size="sm" >
                    {
                      aiMailHook.loading ?
                        <div className="flex items-center justify-center gap-1" >
                          <Spinner />
                          Please wait
                        </div> :
                        "Generate"
                    }
                  </Button>

                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div className="rounded-md overflow-hidden p-0.5">
            <CKEditor
              editor={ClassicEditor}
              data={body}
              onChange={(event, editor) => {
                const data = editor.getData();
                console.log(event)
                setBody(data)
              }}
            />
          </div>

          <Input
            type="file"
            onChange={(e) => setFile(e?.target?.files?.[0])}
          />

        </CardContent>

        <CardFooter>
          <Button disabled={mailComposeHook.loading} onClick={handleSubmit} >
            {
              mailComposeHook.loading ? <div className="flex items-center justify-center gap-1" >
                <Spinner />
                Please wait
              </div> : "Send Email"
            }
          </Button>
        </CardFooter>

      </Card>

    </div>
  )
}