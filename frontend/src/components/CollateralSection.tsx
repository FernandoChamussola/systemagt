import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collateralApi, Collateral } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';

interface CollateralSectionProps {
  dividaId: string;
  garantias?: Collateral[];
}

export default function CollateralSection({ dividaId, garantias }: CollateralSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCollateral, setSelectedCollateral] = useState<Collateral | null>(null);
  const [descricao, setDescricao] = useState('');

  const uploadMutation = useMutation({
    mutationFn: () => collateralApi.upload(dividaId, selectedFile!, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', dividaId] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescricao('');
      toast({
        title: 'Arquivo enviado!',
        description: 'A garantia foi adicionada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar arquivo',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: collateralApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', dividaId] });
      setShowDeleteModal(false);
      setSelectedCollateral(null);
      toast({
        title: 'Garantia removida!',
        description: 'O arquivo foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover garantia',
        description: error.response?.data?.error || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadModal(true);
    }
  }

  function handleUpload() {
    if (!selectedFile) return;
    uploadMutation.mutate();
  }

  function handleDelete() {
    if (!selectedCollateral) return;
    deleteMutation.mutate(selectedCollateral.id);
  }

  function getFileIcon(tipoArquivo: string) {
    if (tipoArquivo.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  }

  function isImage(tipoArquivo: string) {
    return tipoArquivo.startsWith('image/');
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Garantias</h3>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Adicionar Arquivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {garantias && garantias.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {garantias.map((collateral) => (
              <div
                key={collateral.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getFileIcon(collateral.tipoArquivo)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {collateral.nomeArquivo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(collateral.tamanho)}
                      </p>
                    </div>
                  </div>
                </div>

                {collateral.descricao && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {collateral.descricao}
                  </p>
                )}

                {isImage(collateral.tipoArquivo) && (
                  <div
                    className="relative w-full h-32 mb-3 rounded cursor-pointer overflow-hidden"
                    onClick={() => {
                      setSelectedCollateral(collateral);
                      setShowPreviewModal(true);
                    }}
                  >
                    <img
                      src={collateralApi.getUrl(collateral.caminhoArquivo)}
                      alt={collateral.nomeArquivo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => collateralApi.download(collateral.id)}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCollateral(collateral);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma garantia cadastrada ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione fotos ou documentos relacionados à dívida
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Garantia</DialogTitle>
            <DialogDescription>
              Envie um arquivo (foto ou documento) como garantia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedFile && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setShowUploadModal(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedFile.type.startsWith('image/') && (
                  <div className="mt-3">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full rounded"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Foto do carro"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setDescricao('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending || !selectedFile}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este arquivo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Remover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCollateral?.nomeArquivo}</DialogTitle>
            {selectedCollateral?.descricao && (
              <DialogDescription>{selectedCollateral.descricao}</DialogDescription>
            )}
          </DialogHeader>

          {selectedCollateral && isImage(selectedCollateral.tipoArquivo) && (
            <div className="w-full">
              <img
                src={collateralApi.getUrl(selectedCollateral.caminhoArquivo)}
                alt={selectedCollateral.nomeArquivo}
                className="w-full rounded"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Fechar
            </Button>
            <Button onClick={() => selectedCollateral && collateralApi.download(selectedCollateral.id)}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
