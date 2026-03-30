import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useGetAndDelete from "@/hooks/useGetAndDelete"
import { useEffect, useState, useMemo } from "react"
import axios from "axios"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import Loading from "@/components/Loading"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Spinner } from "@/components/ui/spinner"
import usePostAndPut from "@/hooks/usePostAndPut"
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Ellipsis, Send, Sparkles, Trash2 } from "lucide-react"



interface Mail {
  id: number;
  mail_id: string;
  subject: string;
  sender: string;
  date: string;
  category: string;
  body: string;
}

const categoryColors: Record<string, string> = {
  important: "bg-red-100 text-red-700",
  spam: "bg-yellow-100 text-yellow-700",
  promotion: "bg-purple-100 text-purple-700",
  social: "bg-blue-100 text-blue-700",
  updates: "bg-green-100 text-green-700",
  normal: "bg-gray-100 text-gray-700",
}

const Dashboard = () => {
  const getEmailHook = useGetAndDelete(axios.get)
  const syncMailHook = useGetAndDelete(axios.get)
  const sentMailHook = useGetAndDelete(axios.get)
  const generateReplyHook = usePostAndPut(axios.post)
  const composeHook = usePostAndPut(axios.post)
  const deleteMailHook = useGetAndDelete(axios.delete)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] = useState<Mail | null>(null)
  const [selectedReply, setSelectedReply] = useState<Mail | null>(null)
  const [selectedSent, setSelectedSent] = useState<any>(null)
  const [reply, setReply] = useState({
    from: "",
    body: "",
    subject: "",
  })
  const [openMore, setOpenMore] = useState(false)
  const [openReply, setOpenReply] = useState(false)
  const [file, setFile] = useState<File | null | undefined>(null)

  const totalMails = getEmailHook.response?.mails?.length || 0
  const sentMails = sentMailHook.response?.data?.length || 0

  const getMails = async () => {
    await getEmailHook.callApi("mails/get", false, false)
  }

  useEffect(() => {
    getMails()
    sentMailHook.callApi("sent-mails/", false, false)
  }, [])

  const filteredMails = useMemo(() => {
    const mails = getEmailHook.response?.mails || []

    return mails.filter((mail: any) => {
      const matchesSearch =
        mail.subject?.toLowerCase().includes(search.toLowerCase()) ||
        mail.sender?.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        category === "all" || mail.category === category

      return matchesSearch && matchesCategory
    })
  }, [getEmailHook.response, search, category])

  const syncMail = async () => {
    await syncMailHook.callApi("mails/push", false, false)
    await getMails()
  }

  const sentMailsData = sentMailHook.response?.data || []

  if (getEmailHook.loading) {
    return (
      <Loading
        title="Fetching your emails"
        description="Please wait while we fetch the mails..."
      />
    )
  }

  return (
    <div className="w-full h-full">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        <Card>
          <CardHeader>
            <CardTitle>Total Received Mails</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-3xl font-bold">{totalMails}</p>
            </div>
            <Button size="sm" onClick={syncMail}>
              {syncMailHook.loading ? <Spinner /> : "Sync Gmail"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent Mails</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sentMails}</p>
          </CardContent>
        </Card>

      </div>

      <Dialog open={openMore} onOpenChange={setOpenMore}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
            <DialogDescription>
              <p><b>From:</b> {selected?.sender}</p>
              <p><b>Date:</b> {new Date(selected?.date as string).toLocaleString()}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto border rounded-xl p-4 bg-muted/10">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selected?.body || "" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AI REPLY DIALOG */}
      <Dialog open={openReply} onOpenChange={setOpenReply}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Reply to {selectedReply?.sender}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Input value={selectedReply?.sender || ""} readOnly />
            <Input placeholder="Subject" value={reply.subject} onChange={(e) => setReply({ ...reply, subject: e.target.value })} />
            <div className="rounded-md overflow-hidden w-[470px] max-sm:w-[310px] p-0.5">
              <CKEditor
                editor={ClassicEditor}
                data={reply.body}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  console.log(event)
                  setReply({ ...reply, body: data })
                }}
              />
            </div>
            <Input type="file" onChange={(e) => setFile(e?.target?.files?.[0])} />
            <Button
              disabled={composeHook.loading}
              onClick={async () => {
                const formData = new FormData()
                formData.append("to", selectedReply?.sender || "")
                formData.append("subject", reply.subject)
                formData.append("body", reply.body)
                file && formData.append("file", file)
                await composeHook.callApi("mails/compose", formData, false, true, true)
                await sentMailHook.callApi("sent-mails/", false, false)
              }}

            >
              {
                composeHook.loading ? <div className="flex items-center justify-center gap-1" >
                  <Spinner />
                  Please wait
                </div> : <div className="flex items-center justify-center gap-1" >
                  <Send />
                  Send
                </div>
              }
            </Button>
          </div>

        </DialogContent>
      </Dialog>

      <Tabs defaultValue="emails">
        <TabsList className="w-full">
          <TabsTrigger value="emails">Mails</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        {
          filteredMails.length === 0 ? (
            <TabsContent value="emails">
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="text-lg font-medium">No mails found</div>
                <p className="text-sm">Your inbox is empty right now</p>
              </div>
            </TabsContent>
          ) : (
            <TabsContent value="emails">
              <div className="flex items-center gap-3 my-4">

                <Input
                  placeholder="Search mails..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="updates">Updates</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>

                {/* {
                  category === "important" &&
                  <Button>
                    <Sparkles size={16} />
                    Auto Reply
                  </Button>
                } */}

                <Button
                  disabled={deleteMailHook.loading}
                  onClick={async () => {
                    await deleteMailHook.callApi("mails/delete-all", false, false)
                    await getMails()
                  }}
                >
                  {
                    deleteMailHook.loading ?
                      <div className="flex items-center gap-1">
                        <Spinner />
                        Please wait
                      </div>
                      :
                      <div className="flex items-center gap-1">
                        <Trash2 size={16} />
                        Trash All
                      </div>
                  }
                </Button>

              </div>
              <div className="grid gap-3">

                {filteredMails.map((mail: Mail) => (
                  <Card key={mail.id}  >
                    <CardContent className="flex flex-wrap gap-3 justify-between items-start ">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{mail.sender}</p>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full capitalize ${categoryColors[mail.category] ||
                              "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {mail.category}
                          </span>
                        </div>
                        <p className="text-sm">{mail.subject}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelected(mail)
                            setOpenMore(true)
                          }}
                        >
                          <Ellipsis />
                        </Button>
                        <Button
                          size="icon"
                          onClick={async () => {
                            setSelectedReply(mail)
                            const res = await generateReplyHook.callApi("mails/generate-reply", { from_mail: mail.sender, subject: mail.subject, body: mail.body }, false, false, false)
                            setReply({
                              from: mail.sender,
                              body: res.data.reply.body,
                              subject: res.data.reply.subject,
                            })
                            setOpenReply(true)
                          }}
                        >
                          <Sparkles />
                        </Button>


                        <Button
                          size="icon"
                          variant="secondary"
                          disabled={loadingId === mail.id}
                          onClick={async () => {
                            try {
                              setLoadingId(mail.id)
                              await deleteMailHook.callApi(
                                `mails/delete/${mail.id}`,
                                false,
                                false
                              )

                              await getMails()
                            } finally {
                              setLoadingId(null)
                            }
                          }}
                        >
                          {loadingId === mail.id ? (
                            <Spinner />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>

                      </div>
                    </CardContent>
                  </Card>
                ))}

              </div>
            </TabsContent>
          )
        }
        <TabsContent value="sent">
          <Card  >
            <CardContent className="overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sentMailsData.map((mail: any) => (
                    <TableRow key={mail.id}>
                      <TableCell>{mail.to}</TableCell>
                      <TableCell>{mail.subject}</TableCell>

                      <TableCell>
                        <Dialog>
                          <DialogTrigger>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSent(mail)}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{selectedSent?.subject}</DialogTitle>
                              <DialogDescription>
                                <p><b>To:</b> {selectedSent?.to}</p>
                                <p><b>Date:</b> {new Date(selectedSent?.date as string).toLocaleString()}</p>
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto border rounded-xl p-4 bg-muted/10">
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedSent?.body || "" }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default Dashboard