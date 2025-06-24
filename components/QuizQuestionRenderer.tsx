"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import io from "socket.io-client";
import { CheckCircle2, XCircle, Camera } from "lucide-react";
import { updateQuizProgress } from "@/utils/quizAlgorithm";
import { useGestureSocket } from "@/hooks/useGestureSocket";

interface QuizQuestionRendererProps {
  question: {
    id: string;
    type: string;
    level_id: string;
    question_text: string;
    video_url?: string;
    correct_answer?: string;
    options?: string[] | { options: string[] };
    gesture_video_url?: string;
    correct_answer_pairs: Array<{ text: string; videoUrl: string }>;
    memory_options: Array<{ text: string; videoUrl: string }>;
    grid_size?: number;
    user_quiz_progress?: {
      is_completed: boolean;
      user_id: string;
    }[];
  };
  userId: string;
  onComplete: () => void;
}

export default function QuizQuestionRenderer({
  question,
  userId,
  onComplete,
}: QuizQuestionRendererProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState<
    Array<{ text: string; videoUrl: string }>
  >([]);
  const [selectedCard, setSelectedCard] = useState<{
    text: string;
    videoUrl: string;
  } | null>(null);
  const [wrongPair, setWrongPair] = useState<
    Array<{ text: string; videoUrl: string }>
  >([]);

  // Parse options for multiple choice and gesture-to-text questions
  const questionOptions = (() => {
    try {
      if (!question.options) return [];

      const parsedOptions =
        typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;

      // Handle both formats: array directly or {options: array}
      if (Array.isArray(parsedOptions)) {
        return parsedOptions;
      } else if (
        parsedOptions.options &&
        Array.isArray(parsedOptions.options)
      ) {
        return parsedOptions.options;
      } else {
        console.error("Unexpected options format:", parsedOptions);
        return [];
      }
    } catch (error) {
      console.error("Error parsing options:", error);
      return [];
    }
  })();

  const handleSubmit = async () => {
    if (
      question.type === "multiple_choice" ||
      question.type === "gesture_to_text"
    ) {
      if (!selectedAnswer || !question.correct_answer) return;

      const isCorrectAnswer = selectedAnswer === question.correct_answer;
      // Update progress in database
      await updateQuizProgress(
        userId,
        question.id,
        question.level_id,
        isCorrectAnswer
      );
      setIsCorrect(isCorrectAnswer);
      setIsSubmitted(true);
    } else if (question.type === "memory_match") {
      // For memory_match, mark as completed (skipped) if not already completed
      await updateQuizProgress(userId, question.id, question.level_id, false);
      setIsSubmitted(true);
      setIsCorrect(false);
    }
  };

  // Render based on question type
  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
        return renderMultipleChoice();
      case "gesture_to_text":
        return renderGestureToText();
      case "memory_match":
        return renderMemoryMatch();
      default:
        return <p>Unsupported question type</p>;
    }
  };

  const renderMultipleChoice = () => {
    return (
      <>
        {/* Question */}
        <h2 className="text-lg font-medium text-center">
          {question.question_text}
        </h2>

        {/* Video */}
        {question.video_url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-4 mt-2">
            <video
              src={question.video_url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              controls
            />
          </div>
        )}

        {/* Options */}
        <div className="grid gap-3">
          {questionOptions.map((option: string) => (
            <Button
              key={option}
              variant={
                isSubmitted
                  ? option === question.correct_answer
                    ? "default"
                    : option === selectedAnswer
                      ? "destructive"
                      : "outline"
                  : option === selectedAnswer
                    ? "secondary"
                    : "outline"
              }
              className={`w-full p-4 h-auto text-center justify-center ${
                isSubmitted && option === selectedAnswer
                  ? option === question.correct_answer
                    ? "bg-green-100 hover:bg-green-100"
                    : "bg-red-100 hover:bg-red-100"
                  : ""
              }`}
              onClick={() => !isSubmitted && setSelectedAnswer(option)}
              disabled={isSubmitted}
            >
              {option}
            </Button>
          ))}
        </div>
      </>
    );
  };

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [predictionText, setPredictionText] = useState("Menunggu prediksi...");

  const { stopCamera } = useGestureSocket(
    isCameraOpen,
    videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef as React.RefObject<HTMLCanvasElement>,
    (sentence) => {
      setPredictionText("📜 " + sentence);

      // Only proceed if this is a gesture_to_text question and we have a correct_answer
      if (question.type === "gesture_to_text" && question.correct_answer) {
        // Check if correct_answer is a single word (no spaces)
        if (!question.correct_answer.includes(" ")) {
          // Split the sentence into words and check if any word matches the correct_answer
          const words = sentence.toLowerCase().split(/\s+/);
          const correctAnswer = question.correct_answer.toLowerCase();

          if (words.includes(correctAnswer)) {
            // If there's a match, set isCorrect to true
            setIsCorrect(true);
            // Also set isSubmitted to true
            setIsSubmitted(true);
            // Update the progress in the database
            updateQuizProgress(userId, question.id, question.level_id, true);
            // Automatically advance to the next question
            onComplete();
          }
        } else {
          // For multi-word correct answers, check exact match
          if (
            sentence.toLowerCase() === question.correct_answer.toLowerCase()
          ) {
            setIsCorrect(true);
            // Also set isSubmitted to true
            setIsSubmitted(true);
            updateQuizProgress(userId, question.id, question.level_id, true);
            // Automatically advance to the next question
            onComplete();
          }
        }
      }
    }
  );

  const handleCloseCamera = () => {
    stopCamera(); // 🔥 now it stops everything
    setIsCameraOpen(false);
  };

  function renderGestureToText() {
    return (
      <div className="relative">
        <div className="aspect-square xl:aspect-video rounded-lg overflow-hidden bg-slate-100 relative">
          {isCameraOpen ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Optional guide video */}
              {question.gesture_video_url && (
                <div className="absolute top-4 right-4 w-1/4 aspect-video rounded-lg overflow-hidden bg-black/50">
                  <video
                    src={question.gesture_video_url}
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  onClick={async () => {
                    await updateQuizProgress(
                      userId,
                      question.id,
                      question.level_id,
                      true
                    );
                    setIsCorrect(true);
                    setIsSubmitted(true);
                  }}
                  variant="secondary"
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Test Complete
                </Button>
                <Button onClick={handleCloseCamera} variant="destructive">
                  Close Camera
                </Button>
              </div>

              {/* Display prediction text */}
              <div className="absolute top-4 left-4 bg-black/70 text-white text-sm p-2 rounded">
                {predictionText}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Button
                onClick={() => setIsCameraOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8" />
                  <span>Buka Kamera</span>
                </div>
              </Button>
            </div>
          )}
        </div>

        <h2 className="text-lg font-medium text-center mt-4">
          {question.question_text}
        </h2>
      </div>
    );
  }

  // const [isCameraOpen, setIsCameraOpen] = useState(false);
  // const [stream, setStream] = useState<MediaStream | null>(null);
  // const videoRef = useRef<HTMLVideoElement>(null);

  // const handleOpenCamera = async () => {
  //   try {
  //     const mediaStream = await navigator.mediaDevices.getUserMedia({
  //       video: true,
  //     });
  //     setStream(mediaStream);
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = mediaStream;
  //     }
  //     setIsCameraOpen(true);
  //   } catch (error) {
  //     console.error("Error accessing camera:", error);
  //   }
  // };

  // const handleCloseCamera = () => {
  //   if (stream) {
  //     stream.getTracks().forEach((track) => track.stop());
  //     setStream(null);
  //   }
  //   setIsCameraOpen(false);
  // };

  // const renderGestureToText = () => {
  //   return (
  //     <div className="relative">
  //       <div className="aspect-square xl:aspect-video rounded-lg overflow-hidden bg-slate-100 relative">
  //         {isCameraOpen ? (
  //           <>
  //             <video
  //               ref={videoRef}
  //               autoPlay
  //               playsInline
  //               className="w-full h-full object-cover"
  //             />
  //             {question.gesture_video_url && (
  //               <div className="absolute top-4 right-4 w-1/4 aspect-video rounded-lg overflow-hidden bg-black/50">
  //                 <video
  //                   src={question.gesture_video_url}
  //                   autoPlay
  //                   loop
  //                   muted
  //                   className="w-full h-full object-contain opacity-70"
  //                 />
  //               </div>
  //             )}
  //             <div className="absolute bottom-4 right-4 flex gap-2">
  //               <Button
  //                 onClick={async () => {
  //                   setIsCorrect(true);
  //                   setIsSubmitted(true);
  //                   await updateQuizProgress(
  //                     userId,
  //                     question.id,
  //                     question.level_id,
  //                     true
  //                   );
  //                 }}
  //                 variant="secondary"
  //                 className="bg-green-500 hover:bg-green-600 text-white"
  //               >
  //                 Test Complete
  //               </Button>
  //               <Button onClick={handleCloseCamera} variant="destructive">
  //                 Close Camera
  //               </Button>
  //             </div>
  //           </>
  //         ) : (
  //           <div className="flex items-center justify-center h-full">
  //             <Button
  //               onClick={handleOpenCamera}
  //               className="bg-green-500 hover:bg-green-600 text-white rounded-full p-8"
  //             >
  //               <div className="flex flex-col items-center gap-2">
  //                 <Camera className="w-8 h-8" />
  //                 <span>Buka Kamera</span>
  //               </div>
  //             </Button>
  //           </div>
  //         )}
  //       </div>

  //       {/* Question */}
  //       <h2 className="text-lg font-medium text-center mt-4">
  //         {question.question_text}
  //       </h2>
  //     </div>
  //   );
  // };

  const renderMemoryMatch = () => {
    if (!question.memory_options || !question.correct_answer_pairs) {
      return null;
    }

    const totalPairs = question.correct_answer_pairs.length;

    const handleCardClick = (card: { text: string; videoUrl: string }) => {
      // Check if the card is already matched or if the game is submitted
      if (
        isSubmitted ||
        matchedPairs.some(
          (pair) => pair.text === card.text && pair.videoUrl === card.videoUrl
        )
      )
        return;

      if (selectedCard === null) {
        setSelectedCard(card);
      } else {
        const firstCard = selectedCard;
        const secondCard = card;

        // Check if the pair matches any correct_answer_pair
        const isMatch = question.correct_answer_pairs.some(
          (pair) =>
            (firstCard.text === pair.text &&
              secondCard.videoUrl === pair.videoUrl) ||
            (secondCard.text === pair.text &&
              firstCard.videoUrl === pair.videoUrl)
        );

        if (isMatch) {
          // Create new matched pairs with the correct structure
          const newMatchedPairs = [
            ...matchedPairs,
            { text: secondCard.text, videoUrl: firstCard.videoUrl },
          ];
          setMatchedPairs(newMatchedPairs);

          // Only complete when all pairs are matched
          const totalPairsCount = question.correct_answer_pairs.length;
          if (newMatchedPairs.length === totalPairsCount) {
            setIsCorrect(true);
            setIsSubmitted(true);
            // Update progress
            updateQuizProgress(userId, question.id, question.level_id, true);
          }
        } else {
          // Show wrong pair feedback only for the second card that was clicked
          setWrongPair([
            { text: secondCard.text, videoUrl: firstCard.videoUrl },
          ]);
          setTimeout(() => {
            setWrongPair([]);
          }, 1000);
        }
        setSelectedCard(null);
      }
    };

    // Separate videos and text options
    const videoOptions = question.memory_options.filter(
      (option) => option.videoUrl
    );
    const textOptions = question.memory_options.filter((option) => option.text);

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-center mb-4">
          {question.question_text}
        </h2>

        {/* Responsive grid layout - horizontal on md+ screens, vertical on sm screens */}
        <div className="grid md:grid-cols-1 grid-cols-2 gap-4">
          {/* Sign Language Videos */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-center mb-2">
              Bahasa Isyarat
            </h3>
            <div className="space-y-2 flex flex-col md:flex-row justify-around">
              {videoOptions.map((card, index) => {
                const isMatched = matchedPairs.some(
                  (pair) => pair.videoUrl === card.videoUrl
                );
                const isWrong = wrongPair.some(
                  (pair) => pair.videoUrl === card.videoUrl
                );
                return (
                  <div
                    key={index}
                    onClick={() => !isMatched && handleCardClick(card)}
                    className={`aspect-video rounded-lg overflow-hidden ${isMatched ? "cursor-default" : "cursor-pointer"} transition-all duration-300 transform ${!isMatched && "hover:scale-105"} align-middle ${isMatched ? "bg-green-100" : isWrong ? "bg-red-100 border-2 border-red-500" : "hover:bg-gray-200 hover:border-slate-500"}`}
                  >
                    <video
                      src={card.videoUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Text Meanings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-center mb-2">Arti</h3>
            <div className="space-y-2 flex flex-col md:flex-row justify-around">
              {textOptions.map((card, index) => {
                const isMatched = matchedPairs.some(
                  (pair) => pair.text === card.text
                );
                const isWrong = wrongPair.some(
                  (pair) => pair.text === card.text
                );
                return (
                  <div
                    key={index}
                    onClick={() => !isMatched && handleCardClick(card)}
                    className={`aspect-video rounded-lg overflow-hidden ${isMatched ? "cursor-default" : "cursor-pointer"} transition-all duration-300 transform ${!isMatched && "hover:scale-105"} border border-slate-200 flex items-center justify-center w-full h-full align-middle ${isMatched ? "bg-green-100" : isWrong ? "bg-red-100 border-2 border-red-500" : "hover:bg-gray-50"}`}
                  >
                    {card.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {matchedPairs.length} of {totalPairs} pairs matched
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderQuestionContent()}

      {/* Result and Next Button */}
      {isSubmitted ? (
        <div className="space-y-4">
          {question.type === "multiple_choice" && (
            <>
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Benar!</span>
                </div>
              ) : (
                <p className="text-center text-red-600">
                  Maaf, Jawaban kamu salah. Coba lagi ya!
                </p>
              )}
            </>
          )}
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={onComplete}
          >
            Lanjutkan
          </Button>
        </div>
      ) : question.type === "multiple_choice" ? (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!selectedAnswer}
        >
          Periksa Jawaban
        </Button>
      ) : (
        <div className="space-y-4">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={async () => {
              await handleSubmit();
              onComplete();
            }}
          >
            Lewati Soal
          </Button>
        </div>
      )}
    </div>
  );
}
